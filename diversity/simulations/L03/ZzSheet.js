import { BioStage, beats } from './BioStage.js';
import { svgBio, BOX } from '../shared/BioArt.js';
import { seaLabel } from '../shared/SeaBits.js';
const N=['Mushroom','Mycelium','Yeast','Gulmohar','FernPlant','MossClump','PineTree','Cone','PineNeedles','Leaf','Spirogyra','LichenBark','Bacterium','Cyanobacterium','Amoeba','Paramecium','Euglena'];
export class ZzSheet extends BioStage { static BEAT_STEP_MAP=beats(1); static WIDTH=1000; static HEIGHT=800; heights=[[800,800]];
 draw(st){let s='';N.forEach((n,i)=>{const b=BOX[n],x=(i%5)*195+100,y=Math.floor(i/4.99)*190+30,k=Math.min(170/b[2],150/b[3]);s+=svgBio(n,x-(b[0]+b[2]/2)*k,y-b[1]*k,k,n==='Bacterium'?{form:'rod'}:{})+seaLabel(x,y+165,n,{size:13});});return s;}}
