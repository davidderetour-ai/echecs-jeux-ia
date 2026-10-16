#!/usr/bin/env python3
"""Build self-contained, testable *realistic* female GLB from the MIT Rocketbox asset.
Source: Microsoft Rocketbox Female_Adult_07 as converted by react-ai-voice-avatar.
No LLM, paid service, or remote dependency at runtime.

Adds a subtle four-second idle clip (head / arm bone if present, otherwise root).
The source asset's materials, rig, geometry and textures are preserved.
This is NOT a photoreal reconstruction of Alicia's reference image.
"""
import json
import math
import os
from pathlib import Path
import struct
import sys

NAME = "Alicia_Idle_Respiration"
SOURCE = Path(sys.argv[1])
DEST = Path(sys.argv[2])
REPORT = Path(sys.argv[3])
def parse_glb(path):
    data=path.read_bytes()
    if len(data)<28 or data[:4]!=b"glTF" or struct.unpack_from("<I",data,4)[0]!=2:
        raise ValueError("GLB v2 invalid")
    total=struct.unpack_from("<I",data,8)[0]
    if total!=len(data):raise ValueError("GLB size mismatch")
    pos=12
    chunks=[]
    while pos<len(data):
        length,kind=struct.unpack_from("<I4s",data,pos);pos+=8
        chunk=data[pos:pos+length];pos+=length
        if length%4 or pos>len(data):raise ValueError("Bad GLB chunk")
        chunks.append((kind,chunk))
    if len(chunks)!=2 or chunks[0][0]!=b"JSON" or chunks[1][0]!=b"BIN\x00":
        raise ValueError("Only simple GLB with JSON+BIN supported")
    return json.loads(chunks[0][1]),bytearray(chunks[1][1])

def build(doc,buf):
    nodes=doc.get("nodes",[])
    skins=doc.get("skins",[])
    mesh_count=len(doc.get("meshes",[]))
    if not nodes or not skins or mesh_count<1:
        raise ValueError("Source is not a skinned human model; refusing false claims")
    names=[str(n.get("name","")) for n in nodes]
    def choose(*fragments):
        for word in fragments:
            for i,n in enumerate(names):
                if word.lower() in n.lower():return i
        return None
    head=choose("Head","Neck")
    left=choose("LeftArm","LeftUpperArm","LeftShoulder")
    right=choose("RightArm","RightUpperArm","RightShoulder")
    pelvis=choose("Hips","Pelvis","Root")
    selections=[]
    for name,node,axis,radians in [
      ("Head",head,"y",.045),("LeftArm",left,"x",.018),("RightArm",right,"x",-.018),
      ("Hips",pelvis,"z",.012)]:
        if node is not None and node not in [x[1] for x in selections]:
            selections.append((name,node,axis,radians))
    if not selections:
        root=doc.get("scenes",[{}])[doc.get("scene",0)].get("nodes",[0])[0]
        selections=[("Body",root,"y",.02)]
    animations=doc.setdefault("animations",[])
    accessors=doc.setdefault("accessors",[])
    views=doc.setdefault("bufferViews",[])
    buffers=doc.get("buffers",[])
    if len(buffers)!=1:raise ValueError("Expected exactly one buffer")
    def append_blob(blob):
        while len(buf)%4:buf.append(0)
        off=len(buf);buf.extend(blob)
        return off
    timeline=[0,1,2,3,4]
    input_data=struct.pack("<"+"f"*len(timeline),*timeline)
    viewid=len(views)
    off=append_blob(input_data)
    views.append({"buffer":0,"byteOffset":off,"byteLength":len(input_data)})
    input_index=len(accessors)
    accessors.append({"bufferView":viewid,"componentType":5126,"count":5,"type":"SCALAR","min":[0],"max":[4]})
    samplers=[];channels=[]
    for role,node_index,axis,radians in selections:
        rest=nodes[node_index].get("rotation",[0,0,0,1])
        # Quaternion multiplication q(rest)*q(delta) preserves rig's rest orientation.
        def multiply(a,b):
            x,y,z,w=a;X,Y,Z,W=b
            return [w*X+x*W+y*Z-z*Y,w*Y-x*Z+y*W+z*X,w*Z+x*Y-y*X+z*W,w*W-x*X-y*Y-z*Z]
        values=[]
        for phase in [0,1,2,1,0]:
            half=(phase-1)*radians/2
            delta={"x":[math.sin(half),0,0,math.cos(half)],
                   "y":[0,math.sin(half),0,math.cos(half)],
                   "z":[0,0,math.sin(half),math.cos(half)]}[axis]
            q=multiply(rest,delta)
            values.extend(q)
        binary=struct.pack("<"+"f"*len(values),*values)
        off=append_blob(binary);vid=len(views)
        views.append({"buffer":0,"byteOffset":off,"byteLength":len(binary)})
        output=len(accessors)
        accessors.append({"bufferView":vid,"componentType":5126,"count":5,"type":"VEC4"})
        sampler=len(samplers)
        samplers.append({"input":input_index,"output":output,"interpolation":"LINEAR"})
        channels.append({"sampler":sampler,"target":{"node":node_index,"path":"rotation"}})
    animations.append({"name":NAME,"samplers":samplers,"channels":channels})
    buffers[0]["byteLength"]=len(buf)
    return {"meshCount":mesh_count,"skinnedMesh":len(skins),
      "textureCount":len(doc.get("textures",[])),"materialCount":len(doc.get("materials",[])),
      "animationCount":len(animations),"boneNames":names[:120],
      "idleTargets":[{"role":name,"node":idx,"originalName":names[idx]} for name,idx,_,_ in selections],
      "faceMorphNames":sorted(set(k for mesh in doc.get("meshes",[]) for k in mesh.get("extras",{}).get("targetNames",[])))[:80],
      "notes":"Real 3D, source MIT Rocketbox, idle animation; not exact likeness/outfit of reference image."}

def save(path,doc,buf):
    raw=json.dumps(doc,separators=(",",":"),ensure_ascii=False).encode("utf-8")
    raw+=b" " *((-len(raw))%4)
    buf+=b"\0"*((-len(buf))%4)
    total=12+8+len(raw)+8+len(buf)
    binary=b"glTF"+struct.pack("<II",2,total)+struct.pack("<I4s",len(raw),b"JSON")+raw+struct.pack("<I4s",len(buf),b"BIN\0")+buf
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_bytes(binary)
    return total

if __name__=="__main__":
    doc,buf=parse_glb(SOURCE)
    report=build(doc,buf)
    report["fileBytes"]=save(DEST,doc,buf)
    # Structural reopen test in same build.
    again,_=parse_glb(DEST)
    assert again["animations"][-1]["name"]==NAME
    assert all(channel["target"]["node"]<len(again["nodes"]) for channel in again["animations"][-1]["channels"])
    assert again["buffers"][0]["byteLength"]<=DEST.stat().st_size
    REPORT.parent.mkdir(parents=True,exist_ok=True)
    REPORT.write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print("Alicia REALISTIC GLB test OK",report["fileBytes"],"bytes",report["idleTargets"])
