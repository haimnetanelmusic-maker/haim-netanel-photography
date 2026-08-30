import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.112.4";

const allowedOrigins=(Deno.env.get("CLIENT_GALLERY_ALLOWED_ORIGINS")||"https://haimnetanelphoto.co.il,https://www.haimnetanelphoto.co.il,https://haim-netanel-photography.pages.dev").split(",").map(x=>x.trim()).filter(Boolean);
const originOf=(req:Request)=>req.headers.get("origin")||"";
const originAllowed=(req:Request)=>{const o=originOf(req);return !o||allowedOrigins.includes(o)};
const cors=(req:Request)=>{const o=originOf(req);return {
  ...(o&&allowedOrigins.includes(o)?{"Access-Control-Allow-Origin":o,"Vary":"Origin"}:{}),
  "Access-Control-Allow-Headers":"content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS"
}};
const json=(req:Request,data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors(req),"Content-Type":"application/json","Cache-Control":"no-store"}});
async function sha256(value:string){const bytes=new TextEncoder().encode(value);const hash=await crypto.subtle.digest("SHA-256",bytes);return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("")}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS"){if(!originAllowed(req))return new Response(null,{status:403});return new Response("ok",{headers:cors(req)});}
  if(!originAllowed(req))return json(req,{error:"Forbidden origin"},403);
  if(req.method!=="POST")return json(req,{error:"Method not allowed"},405);
  try{
    const supabaseUrl=Deno.env.get("SUPABASE_URL");
    const serviceRoleKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if(!supabaseUrl||!serviceRoleKey)throw new Error("Missing server configuration");
    const db=createClient(supabaseUrl,serviceRoleKey,{auth:{persistSession:false}});
    const body=await req.json();
    const action=body?.action,token=body?.token;
    if(typeof token!=="string"||token.length<20)return json(req,{error:"Invalid access token"},401);
    const tokenHash=await sha256(token);
    const {data:event,error:eventError}=await db.from("events").select("id,title,client_name,event_type,event_date,status,max_selections,storage_folder").eq("client_access_token_hash",tokenHash).maybeSingle();
    if(eventError)throw eventError;
    if(!event)return json(req,{error:"Gallery not found"},404);
    if(event.status==="archived")return json(req,{error:"Gallery unavailable"},403);

    if(action==="get_gallery"){
      const {data:photos,error:photosError}=await db.from("photos").select("id,original_filename,storage_path,preview_path,display_order,width,height").eq("event_id",event.id).order("display_order",{ascending:true});
      if(photosError)throw photosError;
      const rows=photos||[];
      const previewPaths=rows.map(p=>p.preview_path||p.storage_path);
      const originalPaths=rows.map(p=>p.storage_path);
      const [previewSigned,originalSigned]=await Promise.all([
        previewPaths.length?db.storage.from("client-galleries").createSignedUrls(previewPaths,1800):Promise.resolve({data:[],error:null}),
        originalPaths.length?db.storage.from("client-galleries").createSignedUrls(originalPaths,1800):Promise.resolve({data:[],error:null})
      ]);
      if(previewSigned.error)throw previewSigned.error;
      if(originalSigned.error)throw originalSigned.error;
      const previewMap=new Map((previewSigned.data||[]).map((x:any)=>[x.path,x.signedUrl]));
      const originalMap=new Map((originalSigned.data||[]).map((x:any)=>[x.path,x.signedUrl]));
      const resultPhotos=rows.map(p=>({
        id:p.id,filename:p.original_filename,
        image_url:previewMap.get(p.preview_path||p.storage_path)||"",
        full_url:originalMap.get(p.storage_path)||previewMap.get(p.preview_path||p.storage_path)||"",
        width:p.width,height:p.height,display_order:p.display_order
      }));
      const {data:selection,error:selectionError}=await db.from("selections").select("id,status,notes,submitted_at").eq("event_id",event.id).maybeSingle();
      if(selectionError)throw selectionError;
      let selectedPhotoIds:string[]=[];
      if(selection){const {data:items,error:itemsError}=await db.from("selection_items").select("photo_id").eq("selection_id",selection.id);if(itemsError)throw itemsError;selectedPhotoIds=(items||[]).map((item:any)=>item.photo_id)}
      return json(req,{event:{...event},selection:{status:selection?.status||"in_progress",submitted_at:selection?.submitted_at||null,notes:selection?.notes||"",selected_photo_ids:selectedPhotoIds},photos:resultPhotos});
    }

    if(action==="save_selection"){
      const photoIds=body?.photo_ids;if(!Array.isArray(photoIds))return json(req,{error:"photo_ids must be an array"},400);
      const unique=[...new Set(photoIds.filter((id:unknown)=>typeof id==="string"))] as string[];
      if(event.max_selections&&unique.length>event.max_selections)return json(req,{error:"Selection limit exceeded",max_selections:event.max_selections},400);
      let validIds:string[]=[];
      if(unique.length){const {data:valid,error}=await db.from("photos").select("id").eq("event_id",event.id).in("id",unique);if(error)throw error;validIds=(valid||[]).map((p:any)=>p.id);if(validIds.length!==unique.length)return json(req,{error:"One or more photos do not belong to this gallery"},400)}
      let {data:selection,error:selectionError}=await db.from("selections").select("id,status").eq("event_id",event.id).maybeSingle();if(selectionError)throw selectionError;
      if(selection?.status==="submitted")return json(req,{error:"Selection has already been submitted"},409);
      if(!selection){const r=await db.from("selections").insert({event_id:event.id,client_name:event.client_name,status:"in_progress"}).select("id,status").single();if(r.error)throw r.error;selection=r.data}
      const del=await db.from("selection_items").delete().eq("selection_id",selection.id);if(del.error)throw del.error;
      if(validIds.length){const ins=await db.from("selection_items").insert(validIds.map(photo_id=>({selection_id:selection.id,photo_id})));if(ins.error)throw ins.error}
      const upd=await db.from("selections").update({status:"in_progress"}).eq("id",selection.id);if(upd.error)throw upd.error;
      return json(req,{ok:true,selected_count:validIds.length});
    }

    if(action==="submit_selection"){
      const notes=typeof body?.notes==="string"?body.notes.trim().slice(0,3000):"";
      const {data:selection,error}=await db.from("selections").select("id,status").eq("event_id",event.id).maybeSingle();if(error)throw error;
      if(!selection)return json(req,{error:"No selection exists yet"},400);
      if(selection.status==="submitted")return json(req,{ok:true,already_submitted:true});
      const countResult=await db.from("selection_items").select("*",{count:"exact",head:true}).eq("selection_id",selection.id);if(countResult.error)throw countResult.error;
      if(!countResult.count)return json(req,{error:"Please select at least one photo"},400);
      const submittedAt=new Date().toISOString();
      const r=await db.from("selections").update({status:"submitted",notes,submitted_at:submittedAt}).eq("id",selection.id);if(r.error)throw r.error;
      const er=await db.from("events").update({status:"submitted"}).eq("id",event.id);if(er.error)throw er.error;
      return json(req,{ok:true,submitted:true,selected_count:countResult.count,submitted_at:submittedAt});
    }

    return json(req,{error:"Unknown action"},400);
  }catch(error){console.error(error);return json(req,{error:"Internal server error"},500)}
});
