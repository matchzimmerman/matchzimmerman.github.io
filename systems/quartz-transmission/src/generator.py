import cv2
import numpy as np
import math, random, subprocess, os

W, H = 640, 360
FPS = 10
DURATION = 90
TOTAL = FPS * DURATION
OUT = '/mnt/data/quartz_transmission_90s_1bit.mp4'
SEED = 41
random.seed(SEED)
np.random.seed(SEED)

YY, XX = np.mgrid[0:H, 0:W]
PATTERNS = [
    ((XX + YY) % 6 == 0) | ((2 * XX - YY) % 17 == 0),
    ((XX - YY) % 7 == 0) | ((XX + 2 * YY) % 15 == 0),
    ((2 * XX + YY) % 11 == 0) | ((XX - 3 * YY) % 23 == 0),
    ((XX // 3 + YY // 3) % 2 == 0),
    ((3 * XX + 2 * YY) % 19 == 0) | ((XX + 5 * YY) % 31 == 0),
]
DENSITY = [
    np.zeros((H, W), dtype=bool),
    PATTERNS[4], PATTERNS[2], PATTERNS[1], PATTERNS[0], PATTERNS[3],
    np.ones((H, W), dtype=bool),
]

def smooth(x):
    x = max(0.0, min(1.0, x))
    return x*x*(3-2*x)

def window(t, a, b, c, d):
    return smooth((t-a)/(b-a)) * (1.0 - smooth((t-c)/(d-c)))

def rx(p,a):
    x,y,z=p; ca,sa=math.cos(a),math.sin(a)
    return (x,y*ca-z*sa,y*sa+z*ca)

def ry(p,a):
    x,y,z=p; ca,sa=math.cos(a),math.sin(a)
    return (x*ca-z*sa,y,x*sa+z*ca)

def rz(p,a):
    x,y,z=p; ca,sa=math.cos(a),math.sin(a)
    return (x*ca-y*sa,x*sa+y*ca,z)

def project(p,camera=610,scale=440):
    x,y,z=p; s=scale/max(150.0,z+camera)
    return (W/2+x*s,H/2+y*s,s)

BASE_VERTS = [
    (-220,-152,-92), (-118,-194,-84), (-18,-186,-78), (92,-172,-60), (188,-126,-26),
    (232,-48,18), (224,54,64), (168,132,92), (72,184,98), (-38,194,72),
    (-142,174,28), (-216,116,-22), (-252,28,-66), (-244,-72,-94), (-178,-132,-108),
    (-72,-148,-112), (42,-144,-98), (142,-108,-62), (210,-28,-12), (238,68,18),
    (188,150,10), (94,206,4), (-20,220,-8), (-130,204,-28), (-216,154,-56),
    (-264,62,-88), (-82,-24,138), (18,-18,154), (112,18,142), (56,108,150),
    (-48,102,144), (154,92,94), (12,-74,126), (108,-64,110), (-8,52,162),
]
FACES = [
    [0,1,2,3,4,14], [4,5,18,17,16,3], [5,6,19,18], [6,7,20,19], [7,8,21,20],
    [8,9,22,21], [9,10,23,22], [10,11,24,23], [11,12,25,24], [12,13,25],
    [13,14,15,25], [15,16,32,30,26], [16,17,33,32], [17,18,28,33],
    [18,19,31,28], [19,20,31], [26,27,28,29,30], [27,28,31,7,29],
    [26,32,33,28,27], [29,30,10,9,8], [1,2,15,14], [2,3,16,15],
    [6,26,32,33,18,5], [7,29,28,31], [11,12,13,25,24],
    [4,5,18,19,20,17], [0,14,13,12,11,24], [23,24,25,15,26,30,29,22],
    [17,20,21,22,23,30,32,16], [5,6,26,15,14,4], [27,34,29,30],
    [26,27,34,30], [28,31,29,34], [32,33,28,27,26], [8,22,23,9],
]

def base_normal(face):
    a=np.array(BASE_VERTS[face[0]],float); b=np.array(BASE_VERTS[face[1]],float); c=np.array(BASE_VERTS[face[2]],float)
    n=np.cross(b-a,c-a); n/=max(np.linalg.norm(n),1e-9); return n
BASE_NORMALS=[base_normal(f) for f in FACES]

SHARDS=[]
for i in range(28):
    anchor=i%len(BASE_VERTS)
    theta=random.uniform(0,math.tau); phi=random.uniform(-0.9,0.9)
    d=np.array([math.cos(theta)*math.cos(phi),math.sin(phi),math.sin(theta)*math.cos(phi)])
    d/=np.linalg.norm(d)
    SHARDS.append(dict(anchor=anchor,dir=d,radius=random.uniform(150,380),phase=random.uniform(0,math.tau),spin=random.uniform(-1.2,1.2),size=random.uniform(8,24)))

cmd=['ffmpeg','-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','gray','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-pix_fmt','yuv420p','-crf','18','-preset','veryfast','-movflags','+faststart',OUT]
proc=subprocess.Popen(cmd,stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)

for frame in range(TOTAL):
    t=frame/FPS
    bloom=window(t,12,21,39,48)
    rupture=window(t,34,45,66,76)
    helix=smooth((t-58)/13)
    ret=smooth((t-72)/15)
    still=smooth((t-84)/5)
    gscale=0.92+0.12*math.sin(t*0.035)+0.08*bloom-0.04*rupture
    yaw=0.22*t+0.20*math.sin(t*0.071)
    pitch=0.24+0.16*math.sin(t*0.053)
    roll=0.08*math.sin(t*0.12)*(1-still)

    transformed=[]
    for i,(x,y,z) in enumerate(BASE_VERTS):
        local=1+0.035*math.sin(t*0.19+i*0.61)
        cap=1+rupture*0.12*(1 if z>70 else -0.2)
        p=(x*gscale*local,y*gscale*local,z*gscale*cap)
        p=rz(rx(ry(p,yaw),pitch),roll)
        transformed.append(p)
    projected=[project(p) for p in transformed]
    order=sorted(range(len(FACES)),key=lambda fi:sum(transformed[idx][2] for idx in FACES[fi])/len(FACES[fi]))

    canvas=np.zeros((H,W),np.uint8)
    edges=np.zeros((H,W),np.uint8)
    light=np.array([-0.45+0.25*math.sin(t*0.11),-0.50+0.18*math.cos(t*0.09),0.88]); light/=np.linalg.norm(light)

    for fi in order:
        face=FACES[fi]
        poly=np.array([(int(projected[idx][0]),int(projected[idx][1])) for idx in face],np.int32)
        n=tuple(BASE_NORMALS[fi]); n=rz(rx(ry(n,yaw),pitch),roll)
        b=max(0.0,float(np.dot(np.array(n),light)))
        refr=0.18*math.sin(t*0.43+fi*0.81)+0.24*bloom*math.sin(t*1.2+fi*0.39)+0.16*rupture*math.sin(t*2.1+fi)
        val=max(0,min(1,b+refr)); level=max(0,min(6,int(round(val*6))))
        mask=np.zeros((H,W),np.uint8); cv2.fillPoly(mask,[poly],255)
        canvas[(mask>0)&DENSITY[level]]=255
        cv2.polylines(edges,[poly],True,255,1,cv2.LINE_8)
        if bloom>0.05 and fi%4==0:
            cx,cy=poly[:,0].mean(),poly[:,1].mean(); off=2+13*bloom*(0.5+0.5*math.sin(t*0.7+fi))
            echo=[]
            for x,y in poly:
                dx,dy=x-cx,y-cy; mag=max(1.0,math.hypot(dx,dy)); echo.append((int(x+off*dx/mag),int(y+off*dy/mag)))
            cv2.polylines(edges,[np.array(echo,np.int32)],True,255,1,cv2.LINE_8)

    seams=[(1,21),(2,23),(14,29),(0,8),(13,28),(12,27),(25,6),(24,5),(15,31),(3,22),(16,7),(17,10),(26,20),(34,4)]
    for si,(a,b) in enumerate(seams):
        if 0.5+0.5*math.sin(t*(0.35+si*0.013)+si)>0.32-0.22*bloom:
            cv2.line(edges,(int(projected[a][0]),int(projected[a][1])),(int(projected[b][0]),int(projected[b][1])),255,1,cv2.LINE_8)

    if bloom>0.01:
        ids=[0,1,2,3,4,5,6,7,8,9,10,11,12,13]
        hull=np.array([(projected[i][0],projected[i][1]) for i in ids],float); c=hull.mean(axis=0)
        for ring in range(1,8):
            sc=1+ring*(0.035+0.010*math.sin(t*0.4)); pts=((hull-c)*sc+c).astype(np.int32)
            if ((frame//3)+ring)%3!=0: cv2.polylines(edges,[pts],True,255,1,cv2.LINE_8)

    for si,s in enumerate(SHARDS):
        anchor=np.array(transformed[s['anchor']])
        outward=s['dir']*s['radius']*rupture
        ha=s['phase']+t*(0.28+0.015*(si%5)); hr=(165+7*(si%9))*helix
        hp=np.array([math.cos(ha)*hr,(si-13.5)*8+48*math.sin(ha*0.7),math.sin(ha)*hr*0.70])
        cage=np.array([((si%4)-1.5)*105,(((si//4)%4)-1.5)*82,((si//16)-0.5)*150],float)
        cage=np.array(rx(ry(tuple(cage),yaw*0.55),pitch*0.45))
        pos=anchor+outward; pos=pos*(1-helix)+hp*helix; pos=pos*(1-ret)+cage*ret
        px,py,ss=project(tuple(pos)); rr=s['size']*ss*0.20*(1+0.4*rupture); spin=t*s['spin']+s['phase']
        diamond=np.array([(int(px+math.cos(spin+k*math.pi/2)*rr),int(py+math.sin(spin+k*math.pi/2)*rr*1.35)) for k in range(4)],np.int32)
        cv2.polylines(edges,[diamond],True,255,1,cv2.LINE_8)
        if rupture>0.1 and ret<0.8 and si%2==0:
            ax,ay,_=projected[s['anchor']]; cv2.line(edges,(int(ax),int(ay)),(int(px),int(py)),255,1,cv2.LINE_8)

    if ret>0.05:
        cx,cy=W/2,H/2; bx=230*ret; by=152*ret; p=54*ret
        outer=np.array([(cx-bx,cy-by),(cx+bx,cy-by),(cx+bx,cy+by),(cx-bx,cy+by)],np.int32)
        back=np.array([(x+p,y-p*0.55) for x,y in outer],np.int32)
        cv2.polylines(edges,[outer],True,255,1,cv2.LINE_8); cv2.polylines(edges,[back],True,255,1,cv2.LINE_8)
        for a,b in zip(outer,back): cv2.line(edges,tuple(a),tuple(b),255,1,cv2.LINE_8)

    frame_arr=np.maximum(canvas,edges)
    flash=(0.5+0.5*math.sin(t*0.73)>0.88 and (bloom>0.65 or rupture>0.72) and frame%5==0)
    if flash: frame_arr=255-frame_arr
    proc.stdin.write(frame_arr.tobytes())

proc.stdin.close(); err=proc.stderr.read().decode('utf-8','replace'); code=proc.wait()
if code!=0: raise RuntimeError(err[-4000:])
print(OUT)
