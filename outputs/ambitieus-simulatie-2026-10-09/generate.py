"""Reproducible illustrative chart; does not alter the calculator.

The manually chosen net return paths are NOT historical data, random draws,
quantiles or probability bounds. YTD returns reset each year; wealth does not.
Four substeps per month; cash is deposited after each month's return.
"""
from pathlib import Path
import json
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent
SCALE = 2
W, H = 1600, 1160
BG = '#0d2b28'
WHITE = '#f5f5ef'
MUTED = '#b7c8c0'
GOLD = '#d2bb5d'
CORAL = '#f2a28e'
GRID = '#325049'
FONT = '/System/Library/Fonts/Supplemental/Arial.ttf'
BOLD = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'

# Month : net return since the beginning of that hypothetical year (%).
anchors = [
    {0:0, 3:5, 5:-4, 8:14, 10:6, 12:12},
    {0:0, 2:-5, 5:8, 8:16, 10:4, 12:9},
    {0:0, 3:6, 6:-13, 9:-22, 12:-8},
    {0:0, 2:8, 5:3, 8:26, 10:11, 12:18},
    {0:0, 3:9, 5:21, 8:34, 10:17, 12:24},
    {0:0, 3:-9, 6:13, 8:4, 10:-2, 12:5},
    {0:0, 1:2, 2:-6, 3:-27, 4:-21, 6:-15, 8:-9, 10:-12, 12:-6.8},
    {0:0, 2:4, 5:15, 7:7, 10:28, 12:21},
    {0:0, 3:13, 6:24, 8:36.6, 10:28, 12:19},
    {0:0, 2:8, 5:-7, 8:11, 10:3, 12:7},
    {0:0, 3:-4, 5:6, 8:20, 10:8, 12:13},
    {0:0, 2:4, 5:-11, 8:-25, 10:-17, 12:-9},
    {0:0, 3:11, 5:4, 8:29, 10:16, 12:22},
    {0:0, 2:3, 4:-12, 5:-33, 6:-29, 8:-22, 10:-18, 12:-12},
    {0:0, 2:-8, 5:3, 7:12, 9:6, 12:16},
    {0:0, 3:7, 5:-2, 8:19, 10:5, 12:11},
    {0:0, 2:5, 5:-7, 7:9, 10:15, 12:6},
    {0:0, 3:7, 6:-16, 8:-8, 10:2, 12:-4},
    {0:0, 2:-3, 5:8, 8:24, 10:9, 12:12},
    {0:0, 3:10, 6:-5, 8:13, 10:3, 12:8},
]
rng = np.random.default_rng(20261009)
times = [0.0]
wealth = [150000.0]
baseline = [150000.0]
contributed = [150000.0]
year_paths = []
for yi, aa in enumerate(anchors):
    nodes = sorted(aa)
    months = np.linspace(0, 12, 49)
    # Log interpolation preserves positive unit prices. Small bounded bridges
    # add illustrative intramonth movement, without changing the anchor points.
    log_index = np.interp(months, nodes, [math.log1p(aa[m]/100) for m in nodes])
    for left, right in zip(nodes[:-1], nodes[1:]):
        ids = np.where((months > left) & (months < right))[0]
        bridge = np.sin(math.pi * (months[ids]-left)/(right-left))
        log_index[ids] += rng.uniform(-0.010, 0.010, len(ids)) * bridge
    idx = np.exp(log_index)
    ytd = (idx-1)*100
    year_paths.append((yi+months/12, ytd))
    for k in range(1, 49):
        absolute_step = yi*48+k
        deposit = 4000 if absolute_step <= 192 and k % 4 == 0 else 0
        wealth.append(wealth[-1]*idx[k]/idx[k-1]+deposit)
        baseline.append(baseline[-1]*(1+.069/12)**.25+deposit)
        contributed.append(contributed[-1]+deposit)
        times.append(yi+k/48)

assert abs(baseline[-1]-1256518) < 1
assert contributed[-1] == 342000
assert abs(year_paths[6][1][12] - -27) < 1e-8
assert abs(year_paths[6][1][-1] - -6.8) < 1e-8
assert abs(year_paths[8][1][32] - 36.6) < 1e-8
assert abs(year_paths[13][1][20] - -33) < 1e-8
assert min(wealth) > 0

def eur(v):
    return '€ '+f'{v:,.0f}'.replace(',', '.')

def draw_chart(transparent=False):
    im = Image.new('RGBA', (W*SCALE,H*SCALE), (0,0,0,0) if transparent else BG)
    d = ImageDraw.Draw(im)
    def font(size=20,bold=False):
        return ImageFont.truetype(BOLD if bold else FONT, round(size*SCALE))
    def text(x,y,s,size=20,color=WHITE,bold=False,anchor='la'):
        d.text((x*SCALE,y*SCALE),s,font=font(size,bold),fill=color,anchor=anchor)
    def line(points,color=GRID,width=1):
        d.line([(round(x*SCALE),round(y*SCALE)) for x,y in points],fill=color,width=round(width*SCALE),joint='curve')
    def dashed(points,color=WHITE,width=2,on=9,off=7):
        phase=0
        for (x1,y1),(x2,y2) in zip(points[:-1],points[1:]):
            length=math.hypot(x2-x1,y2-y1)
            for j in range(max(1,math.ceil(length))):
                if phase%(on+off)<on:
                    a=j/max(1,math.ceil(length)); b=(j+1)/max(1,math.ceil(length))
                    line([(x1+(x2-x1)*a,y1+(y2-y1)*a),(x1+(x2-x1)*b,y1+(y2-y1)*b)],color,width)
                phase+=1
    def dot(x,y,color=GOLD,r=4):
        d.ellipse(((x-r)*SCALE,(y-r)*SCALE,(x+r)*SCALE,(y+r)*SCALE),fill=color)

    text(70,40,'Ambitieus | belegd vermogen groeit nooit in een rechte lijn.',38,bold=True)
    text(70,98,'€ 150.000 startvermogen  ·  € 4.000 p/m in jaar 1–4  ·  20 jaar beleggen',22,color=MUTED)
    line([(72,157),(112,157)],GOLD,3)
    text(124,143,'Illustratief vermogensverloop',20)
    dashed([(510,157),(556,157)],MUTED,2)
    text(570,143,'Rekenlijn gemiddeld verwacht eindresultaat',20,color=MUTED)
    text(70,200,'VERMOGEN IN EURO’S',17,bold=True)

    x0,x1=145,1360
    X=lambda t:x0+(x1-x0)*t/20
    ymax=math.ceil(max(max(wealth),max(baseline))/400000)*400000
    Y=lambda v:650-v/ymax*390
    for v in np.arange(0,ymax+1,400000):
        y=Y(v)
        line([(x0,y),(x1,y)],GRID,1)
        lab='€ 0' if v==0 else '€ '+f'{v/1e6:.1f}'.replace('.',',')+' mln'
        text(x0-20,y,lab,16,color=MUTED,anchor='rm')
    for t in [0,4,10,15,20]:
        text(X(t),668,str(t),17,color=MUTED,anchor='ma')
    text(750,699,'Jaren sinds start',17,color=MUTED,anchor='ma')
    dashed([(X(t),Y(v)) for t,v in zip(times,baseline)],MUTED,2)
    line([(X(t),Y(v)) for t,v in zip(times,wealth)],GOLD,3)
    dot(X(0),Y(150000))
    text(X(0)+10,Y(150000)-30,'€ 150.000',17,bold=True)
    # Explicitly label independent scenario endpoint and calculator endpoint.
    end_y=Y(wealth[-1]); base_y=Y(baseline[-1])
    dot(x1,end_y)
    line([(x1,end_y),(x1+15,end_y)],GOLD,1)
    text(x1+23,end_y-31,'Dit voorbeeld',16,color=MUTED)
    text(x1+23,end_y-8,eur(wealth[-1]),21,bold=True)
    label_y=max(base_y,end_y+67)
    line([(x1,base_y),(x1+12,base_y),(x1+12,label_y)],MUTED,1)
    text(x1+23,label_y-8,eur(baseline[-1]),19,color=MUTED)
    text(x1+23,label_y+17,'Rekenlijn',16,color=MUTED)
    # Crisis annotation: percentage refers to calendar-year return, not peak drawdown.
    ci=6*48+12
    cx,cy=X(times[ci]),Y(wealth[ci])
    dot(cx,cy,CORAL,4)
    line([(cx,cy-9),(cx,cy-91),(cx-128,cy-91)],CORAL,1)
    text(cx-130,cy-147,'Crisis in jaar 7',20,bold=True)
    text(cx-130,cy-119,'Maart −27% · december −6,8%',17,color=MUTED)
    ci=13*48+20
    cx,cy=X(times[ci]),Y(wealth[ci])
    dot(cx,cy,CORAL,4)
    line([(cx,cy+10),(cx,cy+47),(cx+110,cy+47)],CORAL,1)
    text(cx+12,cy+55,'Jaar 14: tijdelijk −33%',17,color=CORAL)

    text(70,761,'Illustratief rendement binnen elk jaar',17,bold=True)
    text(70,793,'Sinds jaarbegin, exclusief het effect van stortingen. Ieder nieuw jaar begint hier opnieuw op 0%.',18,color=MUTED)
    R=lambda p:1003-(p+38)/80*162
    band=Image.new('RGBA',im.size,(0,0,0,0))
    bd=ImageDraw.Draw(band)
    bd.rectangle((x0*SCALE,R(36.6)*SCALE,x1*SCALE,R(-25)*SCALE),fill=(210,187,93,43))
    im=Image.alpha_composite(im,band); d=ImageDraw.Draw(im)
    for p,lab in [(36.6,'+36,6%'),(0,'0%'),(-25,'−25%')]:
        line([(x0,R(p)),(x1,R(p))],GOLD if p else GRID,1)
        text(x0-20,R(p),lab,17,color=WHITE if p else MUTED,anchor='rm')
    for yi,(xx,pp) in enumerate(year_paths):
        line([(X(yi),R(42)),(X(yi),R(-38))],GRID,1)
        line([(X(t),R(p)) for t,p in zip(xx,pp)],GOLD,2)
        for j in range(1,len(pp)):
            if pp[j]<-25 or pp[j-1]<-25:
                line([(X(xx[j-1]),R(pp[j-1])),(X(xx[j]),R(pp[j]))],CORAL,2.6)
        text(X(yi+.5),1017,str(yi+1),16,color=MUTED,anchor='ma')
    text(750,1047,'Beleggingsjaar',17,color=MUTED,anchor='ma')
    text(70,1090,'Illustratief scenario, het werkelijke verloop kan afwijken.',17,color=MUTED)
    suffix='transparant' if transparent else 'donkergroen'
    path=OUT/f'ambitieus-beweeglijkheid-2026-10-09-{suffix}-v3.png'
    im.save(path)
    return str(path)

metadata = {
    'basis': {'start':150000, 'maandinleg':4000, 'inleg_maanden':48, 'horizon_jaren':20,
              'rendement_calculator':.069, 'inlegmoment':'einde maand'},
    'rekenlijn_eindvermogen':baseline[-1], 'voorbeeld_eindvermogen':wealth[-1],
    'eigen_inleg_totaal':contributed[-1],
    'jaareindrendementen_pct':[a[12] for a in anchors],
    'geometrisch_rendement_scenario':math.prod(1+a[12]/100 for a in anchors)**(1/20)-1,
    'betekenis_band':'Door gebruiker aangeleverde illustratieve jaar-tot-datum rendementsgrenzen; geen statistische of gegarandeerde grenzen.',
    'methode':'Handmatig gekozen maandankers, log-interpolatie en reproduceerbare kleine variaties tussen ankers. Geen Monte Carlo, historische reeks of voorspelling. Rendementen verondersteld netto.',
    'jaarankers_pct':anchors,
    'pngs':[draw_chart(False),draw_chart(True)],
}
(OUT/'berekening-v3.json').write_text(json.dumps(metadata,indent=2,ensure_ascii=False)+'\n')
print(json.dumps(metadata,indent=2,ensure_ascii=False))
