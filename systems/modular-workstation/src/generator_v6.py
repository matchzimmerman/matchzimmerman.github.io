from pathlib import Path
import argparse, math, subprocess, wave, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W,H=480,360
FPS=24
DURATION=22
FRAMES=FPS*DURATION
GRID_X,GRID_Y=76,52
AMBER=(255,126,31)

def font(sz):
    for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf','/usr/share/fonts/truetype/liberation2/LiberationMono-Regular.ttf']:
        try:return ImageFont.truetype(p,sz)
        except:pass
    return ImageFont.load_default()
F8,F10,F18=font(8),font(10),font(18)

def smooth(a,b,x):
    q=np.clip((x-a)/(b-a),0,1); return q*q*(3-2*q)

def audio(path,seed):
    sr=48000; t=np.arange(int(sr*DURATION))/sr
    rng=np.random.default_rng(seed)
    hum=.18*np.sin(2*np.pi*(32.7+.7*np.sin(t*.09))*t)
    sub=.09*np.sin(2*np.pi*49*t+.65*np.sin(t*.17))
    beat=.05*np.sin(2*np.pi*.23*t)*np.sin(2*np.pi*73.5*t)
    pulses=np.zeros_like(t)
    for at in [4.5,8.9,13.4,17.8]:
        env=np.exp(-np.maximum(0,t-at)*3.5)*(t>=at)
        pulses += env*.055*np.sin(2*np.pi*(98+11*np.sin(at))*t)
    n=rng.normal(0,1,len(t)); air=np.zeros_like(n)
    for i in range(1,len(n)):air[i]=air[i-1]+.003*(n[i]-air[i-1])
    sig=np.tanh((hum+sub+beat+pulses+.032*air)*1.65)
    st=np.stack([sig*(.97+.03*np.sin(t*.13)),sig*(.97-.03*np.sin(t*.13))],1)
    st=(st/np.max(np.abs(st))*.85*32767).astype(np.int16)
    with wave.open(str(path),'wb') as wf:
        wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(sr); wf.writeframes(st.tobytes())

class InterferenceField:
    def __init__(self,seed,state_in=None):
        self.seed=seed; self.rng=np.random.default_rng(seed)
        xs=np.linspace(.06,.94,GRID_X); ys=np.linspace(.16,.92,GRID_Y)
        self.X,self.Y=np.meshgrid(xs,ys)
        self.phase=self.rng.uniform(-np.pi,np.pi,(GRID_Y,GRID_X)).astype(np.float32)
        self.memory=np.zeros_like(self.phase); self.age=0
        if state_in and Path(state_in).exists():
            try:
                z=np.load(state_in)
                if 'angle' in z:
                    old=z['angle']; self.phase=np.array(Image.fromarray(old).resize((GRID_X,GRID_Y),Image.Resampling.BILINEAR),dtype=np.float32)
                if 'phase' in z:
                    old=z['phase']; self.phase=np.array(Image.fromarray(old).resize((GRID_X,GRID_Y),Image.Resampling.BILINEAR),dtype=np.float32)
                if 'memory' in z:
                    old=z['memory']; self.memory=np.array(Image.fromarray(old).resize((GRID_X,GRID_Y),Image.Resampling.BILINEAR),dtype=np.float32)
                self.age=int(z.get('age',0))
            except:pass

    def state(self,t):
        X,Y=self.X,self.Y
        a1=2*np.pi*t/9.0; a2=2*np.pi*t/17.0; a3=2*np.pi*t/41.0; a4=2*np.pi*t/73.0
        f1=np.sin(12*X+4*Y+a1); f2=np.sin(7*X-11*Y-a2)
        f3=np.sin(18*np.sqrt((X-.51)**2+(Y-.54)**2)-a3)
        f4=np.sin(9*X+15*Y+a4+1.2*np.sin(3*Y-a2))
        field=.32*f1+.27*f2+.24*f3+.17*f4
        gy,gx=np.gradient(field); target=np.arctan2(gy,gx)+np.pi/2
        pulse=(.5+.5*np.cos(a1-a2))*(.55+.45*np.cos(a3*2-a1)); pulse=np.clip(pulse,0,1)
        local=.08+.36*pulse
        delta=np.angle(np.exp(1j*(target-self.phase)))
        self.phase += local*delta + .012*np.sin(6*self.phase+field*3)
        events=[(4.0,6.3,'ring'),(8.2,10.5,'fold'),(12.2,14.7,'helix'),(16.4,19.0,'cube')]
        event_strength=0
        for start,end,kind in events:
            e=smooth(start,start+.7,t)*(1-smooth(end-.7,end,t))
            if e<=0: continue
            event_strength=max(event_strength,e)
            if kind=='ring':
                dx=X-.5; dy=Y-.55; shape=np.arctan2(dy,dx)+np.pi/2
                mask=np.exp(-((np.sqrt(dx*dx+dy*dy)-.26)/.08)**2)
            elif kind=='fold':
                shape=np.arctan2(np.sin(12*X+t*.5),np.cos(8*Y-t*.37))
                mask=np.exp(-((Y-(.52+.16*np.sin(7*X+t*.34)))/.12)**2)
            elif kind=='helix':
                center=.54+.16*np.sin(10*X-t*.7)
                shape=np.arctan2(np.cos(10*X-t*.7),np.ones_like(X)*2.2)
                mask=np.exp(-((Y-center)/.11)**2)+np.exp(-((Y-(1.08-center))/.11)**2); mask=np.clip(mask,0,1)
            else:
                d1=np.abs((Y-.55)-.72*(X-.5)); d2=np.abs((Y-.55)+.72*(X-.5)); d3=np.abs(X-.5)
                mask=np.exp(-(np.minimum(np.minimum(d1,d2),d3)/.06)**2); shape=np.where(d1<d2,.62,-.62)
            dd=np.angle(np.exp(1j*(shape-self.phase))); self.phase += e*mask*.19*dd
        coherence=np.abs(np.cos(self.phase-target)); self.memory=.988*self.memory+.012*coherence; self.age+=1
        return field,coherence,event_strength,pulse

    def save(self,path):
        Path(path).parent.mkdir(parents=True,exist_ok=True)
        np.savez_compressed(path,phase=self.phase,memory=self.memory,age=self.age)

    def render(self,t,frame):
        field,coh,event,pulse=self.state(t)
        im=Image.new('RGB',(W,H),(3,6,5)); d=ImageDraw.Draw(im)
        garr=np.clip((self.memory*.42+coh*.18)*255,0,255).astype(np.uint8)
        ghost=Image.fromarray(garr).resize((W,H),Image.Resampling.BILINEAR).filter(ImageFilter.GaussianBlur(6))
        tint=Image.new('RGB',(W,H),(20,91,77)); im=Image.composite(tint,im,ghost.point(lambda p:int(p*.30))); d=ImageDraw.Draw(im)
        sx=(W*.88)/(GRID_X-1); sy=(H*.73)/(GRID_Y-1); ox=W*.06; oy=H*.16
        for j in range(GRID_Y):
            for i in range(GRID_X):
                a=float(self.phase[j,i]); q=float(coh[j,i]); m=float(self.memory[j,i]); x=ox+i*sx; y=oy+j*sy
                rhythmic=.58+.42*math.sin(i*.31+j*.17+t*2.1); ln=1.8+4.9*(.35*q+.65*m)*rhythmic
                bright=int(62+150*np.clip(.28*q+.72*m,0,1)); col=(int(bright*.38),bright,int(bright*.82))
                dx=math.cos(a)*ln; dy=math.sin(a)*ln; d.line((x-dx,y-dy,x+dx,y+dy),fill=col,width=1)
                if q>.94 and ((i+j+frame)%7==0): d.point((x,y),fill=(176,221,197))
        d.rectangle((11,10,469,349),outline=(25,44,38),width=1); d.rectangle((17,14,329,42),fill=(3,6,5))
        d.text((22,18),'FIELD STATION: MAGPIE',font=F18,fill=(90,44,16)); jx=int(round(.7*math.sin(t*12.3)))
        d.text((22+jx,17),'FIELD STATION: MAGPIE',font=F18,fill=AMBER)
        d.text((23,43),'INTERFERENCE FIELD 03 / VECTOR CONSENSUS',font=F8,fill=(74,156,136))
        d.text((369,19),'LIVE',font=F10,fill=(176,190,173)); d.text((403,19),f'{pulse:.3f}',font=F10,fill=(92,122,105))
        d.text((22,336),f'RUN TIME {(self.age/FPS):010.3f}',font=F8,fill=(82,104,91)); d.text((369,336),f'ALIGN {float(coh.mean()):.3f}',font=F8,fill=(82,104,91))
        arr=np.asarray(im).astype(np.float32); arr[1::2]*=.78
        for y in range(H):
            shift=int(1.3*math.sin(y*.027+t*.74)+.7*math.sin(t*3.1)); arr[y]=np.roll(arr[y],shift,axis=0)
        rng=np.random.default_rng(self.seed+frame*31); arr+=rng.normal(0,1.5,(H,W,1)); arr=np.clip(arr,0,255).astype(np.uint8)
        im=Image.fromarray(arr); glow=im.resize((W//3,H//3),Image.Resampling.BILINEAR).filter(ImageFilter.GaussianBlur(2.0)).resize((W,H),Image.Resampling.BILINEAR)
        return Image.blend(im,glow,.11).resize((960,720),Image.Resampling.NEAREST)

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--seed',type=int,default=6031); ap.add_argument('--output',required=True); ap.add_argument('--thumbnail')
    ap.add_argument('--state-in'); ap.add_argument('--state-out'); ap.add_argument('--metadata-out'); ap.add_argument('--generation',type=int,default=3)
    ap.add_argument('--execution-id',default='phase-field-03'); ap.add_argument('--parent-id'); ap.add_argument('--parent-seed',type=int); a=ap.parse_args()
    out=Path(a.output); out.parent.mkdir(parents=True,exist_ok=True); wav=out.with_suffix('.wav'); audio(wav,a.seed); sim=InterferenceField(a.seed,a.state_in)
    cmd=['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s','960x720','-r',str(FPS),'-i','-','-i',str(wav),'-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-shortest',str(out)]
    p=subprocess.Popen(cmd,stdin=subprocess.PIPE); thumb=None
    for f in range(FRAMES):
        im=sim.render(f/FPS,f)
        if f==int(FRAMES*.61):thumb=im.copy()
        p.stdin.write(np.asarray(im,dtype=np.uint8).tobytes())
    p.stdin.close(); code=p.wait(); wav.unlink(missing_ok=True)
    if code: raise SystemExit(code)
    if a.thumbnail and thumb:
        Path(a.thumbnail).parent.mkdir(parents=True,exist_ok=True); thumb.save(a.thumbnail,quality=94)
    if a.state_out: sim.save(a.state_out)
    if a.metadata_out:
        meta={'seed':a.seed,'duration':DURATION,'fps':FPS,'generation':a.generation,'execution_id':a.execution_id,'parent_id':a.parent_id,'parent_seed':a.parent_seed,'language':'rotating vector consensus','resolved_graphics':False,'title':'FIELD STATION: MAGPIE'}
        Path(a.metadata_out).write_text(json.dumps(meta,indent=2))

if __name__=='__main__':main()
