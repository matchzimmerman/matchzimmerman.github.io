#!/usr/bin/env python3
"""MAGPIE conformal hinge loom v1.

A deterministic conversation-tested animation that evolves a single black line
into a compressed conformal loom, traveling hinge, and large oval bloom. The
soundtrack stays in the established low-sine / tuned-bass / low-tom lane.
"""
from PIL import Image, ImageDraw
import numpy as np
import math
import os
import wave
import subprocess

OUT = "/mnt/data"
NAME = "magpie_conformal_hinge_loom_v1"
MP4 = f"{OUT}/{NAME}.mp4"
WAV = f"{OUT}/{NAME}_audio.wav"
PREVIEW_A = f"{OUT}/{NAME}_preview_open.png"
PREVIEW_B = f"{OUT}/{NAME}_preview_hinge.png"
PREVIEW_C = f"{OUT}/{NAME}_preview_bloom.png"

W = H = 480
FPS = 4
DUR = 66
N = FPS * DUR
SR = 22050

PAPER = np.array([246, 242, 232], dtype=np.float32)
SHADOW = np.array([235, 230, 220], dtype=np.float32)
INK = (18, 18, 18)

yy = np.linspace(0, 1, H)[:, None]
xx = np.linspace(0, 1, W)[None, :]
rng = np.random.default_rng(424242)
fixed_grain = rng.normal(0, 1, (H, W, 1)).astype(np.float32)

def clamp01(x): return max(0.0, min(1.0, x))
def smootherstep(x):
    x = clamp01(x)
    return x*x*x*(x*(x*6-15)+10)
def interval(p, a, b): return smootherstep((p-a)/max(1e-9,b-a))

def base_y(xn,t):
    return H*.50 + 17*math.sin(2*math.pi*(xn*.32+.0042*t)) + 8*math.sin(2*math.pi*(xn*.92-.005*t+.2)) + 4*math.sin(2*math.pi*(xn*2.2+.0061*t+.7))

def multiplicity(p):
    if p<.14:return 1
    if p<.30:return 3
    if p<.48:return 7
    if p<.78:return 11
    return 5

def split_step(p):
    v=24*interval(p,.10,.30)
    q=interval(p,.34,.54)
    v=v*(1-q)+7*q
    q=interval(p,.68,.82)
    v=v*(1-q)+33*q
    q=interval(p,.86,1)
    return v*(1-q)+10*q

def hinge_warp(xn,t,p):
    strength=interval(p,.34,.55)*(1-.55*interval(p,.72,.90))
    center=-.10+1.20*interval(p,.36,.66)
    sigma=.11+.03*math.sin(t*.035)
    g=math.exp(-.5*((xn-center)/sigma)**2)
    fold=math.sin((xn-center)*math.pi/sigma)*g
    return strength,g,fold

def ring_morph(xn,y,t,p):
    m=interval(p,.60,.78)*(1-.40*interval(p,.90,1))
    if m<=0:return xn*W,y
    theta=(xn-.5)*math.pi*1.72
    rx=W*.43; ry=H*.24+16*math.sin(t*.028)
    ring_x=W*.5+rx*math.sin(theta)
    ring_y=H*.52+ry*math.cos(theta)
    radial=y-H*.5
    ring_x+=radial*.16*math.sin(theta)
    ring_y+=radial*.78
    return xn*W*(1-m)+ring_x*m, y*(1-m)+ring_y*m

def make_background(i):
    t=i/FPS
    arr=np.zeros((H,W,3),dtype=np.float32)
    grad=.64*yy+.020*np.sin(2*math.pi*(yy*.38+.0011*t))+.012*np.cos(2*math.pi*(xx*.27-.0008*t))
    for c in range(3):
        arr[:,:,c]=PAPER[c]+(SHADOW[c]-PAPER[c])*grad
    cx=.5+.035*math.sin(.006*t); cy=.48+.028*math.cos(.007*t)
    stain=np.exp(-(((xx-cx)**2)/(2*.40**2)+((yy-cy)**2)/(2*.33**2)))
    arr-=stain[:,:,None]*3
    arr+=fixed_grain*1.45
    return np.clip(arr,0,255).astype(np.uint8)

def make_frame(i):
    t=i/FPS; p=i/(N-1)
    img=Image.fromarray(make_background(i),"RGB").convert("RGBA")
    layer=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(layer)
    count=multiplicity(p); step=split_step(p)
    for rank in range(count):
        center=(count-1)/2; coeff=rank-center
        dist=abs(coeff)/max(1,center)
        entry=interval(p,.10+dist*.18,.22+dist*.18)
        late=interval(p,.80,1)
        alpha=int((210-55*dist)*entry*(1-.30*late))
        if alpha<3:continue
        pts=[]
        for px in range(-8,W+9,3):
            xn=px/W
            y=base_y(xn,t)
            taper=.18+.82*(1-abs(xn-.5)*1.55)
            braid=interval(p,.24,.52)*(1-.60*interval(p,.86,1))
            y+=coeff*step
            y+=braid*taper*(8*math.sin(2*math.pi*(xn*1.1-.007*t)+coeff*.68))
            hs,g,fold=hinge_warp(xn,t,p)
            y=y*(1-.72*hs*g)+(H*.5+coeff*3.2)*(.72*hs*g)
            y+=fold*hs*(42+3*abs(coeff))
            y+=11*interval(p,.58,.78)*math.sin(t*.085+coeff*.35)
            x2,y2=ring_morph(xn,y,t,p)
            pts.append((int(x2),int(y2)))
        width=3 if abs(coeff)<.6 else 2 if abs(coeff)<2 else 1
        d.line(pts,fill=(*INK,alpha),width=width)
    scar=interval(p,.43,.58)*(1-.25*interval(p,.92,1))
    if scar>.01:
        pts=[]
        for px in range(-8,W+9,3):
            xn=px/W
            y=H*.31+10*math.sin(2*math.pi*(xn*.48-.0044*t))+5*math.sin(2*math.pi*(xn*1.25+.003*t+1.1))
            x2,y2=ring_morph(xn,y,t,p)
            pts.append((int(x2),int(y2)))
        d.line(pts,fill=(*INK,int(150*scar)),width=2)
    aperture=interval(p,.38,.52)*(1-interval(p,.70,.82))
    if aperture>.01:
        center=int((-.10+1.20*interval(p,.36,.66))*W)
        hh=int(75+85*aperture)
        d.line((center,H//2-hh,center,H//2+hh),fill=(*INK,int(55*aperture)),width=1)
    img=Image.alpha_composite(img,layer)
    arr=np.array(img.convert("RGB")).astype(np.float32)
    arr+=np.random.default_rng(90000+i).normal(0,.22,(H,W,1))
    return np.clip(arr,0,255).astype(np.uint8)

# Audio: low-sine round / bass melody / tom pressure.
audio_n=int(DUR*SR)
sigL=np.zeros(audio_n,dtype=np.float32); sigR=np.zeros(audio_n,dtype=np.float32)
def add_audio(mono,start,pan=0,gain=1):
    st=int(start*SR)
    if st>=audio_n:return
    ln=min(len(mono),audio_n-st)
    L=math.cos((pan+1)*math.pi/4); R=math.sin((pan+1)*math.pi/4)
    sigL[st:st+ln]+=mono[:ln]*gain*L; sigR[st:st+ln]+=mono[:ln]*gain*R

D1=36.71;D2=73.42;F2=87.31;G1=49.;G2=98.;A1=55.;A2=110.;Bb1=58.27;Bb2=116.54;C2=65.41;C3=130.81
D3=146.83;E3=164.81;F3=174.61;G3=196.;A3=220.;Bb3=233.08;C4=261.63;D4=293.66
chords=[[D1,D2,A2,C3,F3],[Bb1,Bb2,F2,A2,D3],[G1,G2,D2,F2,Bb2],[C2,C3,G2,D3,E3]]

def pad_tone(freq,start,end,amp=.02,pan=0):
    st=int(start*SR);en=min(audio_n,int(end*SR));ln=en-st
    if ln<=0:return
    tt=np.arange(ln,dtype=np.float32)/SR
    fade=min(3.5,(end-start)/3)
    env=np.minimum(np.clip(tt/fade,0,1),np.clip((end-start-tt)/fade,0,1))
    tone=np.sin(2*np.pi*freq*tt).astype(np.float32)+.10*np.sin(2*np.pi*freq*2*tt+.2).astype(np.float32)
    add_audio(np.tanh(tone*.9)*env,start,pan,amp)

region=DUR/4
for r in range(4):
    for f,pan,amp in zip(chords[r],[-.42,-.18,0,.20,.44],[.030,.024,.018,.012,.008]):
        pad_tone(f,r*region,(r+1)*region+2.5,amp,pan)

def low_kick(start,amp=.22):
    ln=int(.6*SR);tt=np.arange(ln,dtype=np.float32)/SR
    freq=38+52*np.exp(-tt*22);phase=2*np.pi*np.cumsum(freq)/SR
    add_audio(np.tanh(np.sin(phase).astype(np.float32)*1.08)*np.exp(-tt*7.2).astype(np.float32),start,0,amp)

def tom(start,freq=92,amp=.03,pan=0):
    ln=int(.44*SR);tt=np.arange(ln,dtype=np.float32)/SR
    pitch=freq+14*np.exp(-tt*15);phase=2*np.pi*np.cumsum(pitch)/SR
    tone=(np.sin(phase)+.12*np.sin(2*phase+.2)).astype(np.float32)
    env=np.exp(-tt*8).astype(np.float32)*(1-np.exp(-tt*40)).astype(np.float32)
    add_audio(np.tanh(tone*env),start,pan,amp)

for k,st in enumerate(np.arange(6,DUR-4,1.5)):
    low_kick(float(st),.22 if k%2==0 else .17)
    if k%2: tom(float(st+.74),92 if k%4 else 110,.028,-.28 if k%4 else .28)

def bass_note(freq,start,dur=.48,amp=.052):
    ln=int(dur*SR);tt=np.arange(ln,dtype=np.float32)/SR
    phase=2*np.pi*freq*tt
    tone=np.sin(phase).astype(np.float32)
    for k in range(2,6): tone+=(.28/k)*np.sin(k*phase+k*.16).astype(np.float32)
    env=(1-np.exp(-tt*62))*np.exp(-tt*2.4)
    add_audio(np.tanh(tone*env*1.5),start,0,amp)

motif=[D1,D2,F2,A1,C2,A1,F2,D2,G1,G2,Bb1,D2,F2,D2,C2,A1]
positions=[0,.75,1.5,2.25,3,3.5,4.25,5,6,6.75,7.5,8.25,9,9.5,10.25,11]
for base in [14,26,38,50]:
    for f,pos in zip(motif,positions): bass_note(f,base+pos*.72,.43,.052 if base<38 else .058)
for base in [23,35,47]:
    for f,pos in zip(motif,positions): bass_note(f*2,base+pos*.72,.32,.018)

upper=[D3,F3,A3,C4,D4,C4,A3,F3,E3,G3,Bb3,D4]
for i,f in enumerate(upper):
    st=39+i*.68;ln=int(.72*SR);tt=np.arange(ln,dtype=np.float32)/SR
    env=(1-np.exp(-tt*22))*np.exp(-tt*.85)
    add_audio(np.sin(2*np.pi*f*tt).astype(np.float32)*env,st,-.45+(i/(len(upper)-1))*.9,.009)

for delay,gain,cross in [(.28,.08,.26),(.56,.05,.38),(1.12,.025,.52)]:
    d=int(delay*SR);l=sigL.copy();r=sigR.copy()
    sigL[d:]+=((1-cross)*l[:-d]+cross*r[:-d])*gain
    sigR[d:]+=((1-cross)*r[:-d]+cross*l[:-d])*gain

sigL=np.tanh(sigL*1.12);sigR=np.tanh(sigR*1.12)
fade=int(1.4*SR)
sigL[:fade]*=np.linspace(0,1,fade);sigR[:fade]*=np.linspace(0,1,fade)
sigL[-fade:]*=np.linspace(1,0,fade);sigR[-fade:]*=np.linspace(1,0,fade)
mx=max(np.max(np.abs(sigL)),np.max(np.abs(sigR)),1e-9)
sigL=.88*sigL/mx;sigR=.88*sigR/mx
inter=np.empty(audio_n*2,dtype=np.int16)
inter[0::2]=np.int16(sigL*32767);inter[1::2]=np.int16(sigR*32767)
with wave.open(WAV,"w") as wf:
    wf.setnchannels(2);wf.setsampwidth(2);wf.setframerate(SR);wf.writeframes(inter.tobytes())

Image.fromarray(make_frame(0)).save(PREVIEW_A)
Image.fromarray(make_frame(int(N*.52))).save(PREVIEW_B)
Image.fromarray(make_frame(int(N*.76))).save(PREVIEW_C)

cmd=["ffmpeg","-y","-f","rawvideo","-vcodec","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-",
     "-i",WAV,"-c:v","libx264","-pix_fmt","yuv420p","-preset","veryfast","-crf","25","-movflags","+faststart",
     "-c:a","aac","-b:a","112k","-shortest",MP4]
proc=subprocess.Popen(cmd,stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
for i in range(N): proc.stdin.write(make_frame(i).tobytes())
proc.stdin.close()
ret=proc.wait()
if ret != 0:
    raise RuntimeError(f"ffmpeg failed with code {ret}")

print(MP4)
