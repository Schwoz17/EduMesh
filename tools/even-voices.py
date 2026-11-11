# Evens out recorded clips: same speaking speed (syllables per second), same loudness, same silence at both ends.
# Usage (from the repo root): python3 tools/even-voices.py voice/clips /tmp/even 5.4  then copy /tmp/even/*.mp3 into voice/clips/
import json,subprocess,re,sys,os,shutil,statistics as st
SRC,DST,TARGET=sys.argv[1],sys.argv[2],float(sys.argv[3])
os.makedirs(DST,exist_ok=True)
man={m['id']:m for m in json.load(open('voice/manifest.json'))}
idx=json.load(open(SRC+'/index.json'))
ONES='zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
TENS='_ _ twenty thirty forty fifty sixty seventy eighty ninety'.split()
def words(n):
    n=int(n)
    if n<20: return ONES[n]
    if n<100: return TENS[n//10]+('' if n%10==0 else ' '+ONES[n%10])
    if n<1000: return ONES[n//100]+' hundred'+('' if n%100==0 else ' and '+words(n%100))
    return ' '.join(ONES[int(c)] for c in str(n))
def syl(text):
    t=re.sub(r'\d+',lambda m:' '+words(m.group())+' ',text.lower())
    t=t.replace('lcm','el see em')
    n=0
    for x in re.findall(r"[a-zà-ÿ̀-ͯḀ-ỿ']+",t):
        n+=max(1,len(re.findall(r'[aeiouyàáèéìíòóùúẹọ]+',x)))
    return n
TRIM='silenceremove=start_periods=1:start_threshold=-40dB:start_silence=0.03,areverse,silenceremove=start_periods=1:start_threshold=-40dB:start_silence=0.03,areverse'
def dur(path,af=TRIM):
    out=subprocess.run(['ffmpeg','-hide_banner','-i',path,'-af',af,'-f','null','-'],capture_output=True,text=True).stderr
    h,m,s=re.findall(r'time=(\d+):(\d+):([\d.]+)',out)[-1]; return int(h)*3600+int(m)*60+float(s)
before,after=[],[]
for i in idx:
    src=f'{SRC}/{i}.mp3'; m=man.get(i)
    s=syl(m['text']) if m else 0; t=dur(src)
    f=1.0
    if s>=3 and t>0: f=max(0.55,min(1.35,TARGET/(s/t)))  # atempo factor: >1 speeds up, <1 slows down
    tmp=f'{DST}/_tmp.wav'
    subprocess.run(['ffmpeg','-y','-loglevel','fatal','-i',src,'-af',f'{TRIM},atempo={f:.4f}','-ac','1','-ar','24000',tmp],check=True)
    o=subprocess.run(['ffmpeg','-hide_banner','-i',tmp,'-af','volumedetect','-f','null','-'],capture_output=True,text=True).stderr
    mean=float(re.search(r'mean_volume: (-?[\d.]+)',o).group(1)); peak=float(re.search(r'max_volume: (-?[\d.]+)',o).group(1))
    g=-19.0-mean
    af=f'volume={g:.2f}dB,alimiter=limit=0.89:level=false,adelay=120,apad=pad_dur=0.12'
    subprocess.run(['ffmpeg','-y','-loglevel','fatal','-i',tmp,'-af',af,'-ac','1','-ar','24000','-b:a','40k',f'{DST}/{i}.mp3'],check=True)
    os.remove(tmp)
    if s>=3: before.append((m['lang'],s/t)); after.append((m['lang'],s/dur(f'{DST}/{i}.mp3')))
shutil.copy(SRC+'/index.json',DST+'/index.json')
for name,rows in (('before',before),('after',after)):
    for L in ('en','pcm'):
        r=sorted(x[1] for x in rows if x[0]==L)
        print(name,L,'median %.2f  range %.2f-%.2f'%(st.median(r),r[0],r[-1]))
