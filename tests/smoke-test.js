const fs=require('fs'); const vm=require('vm');
const game=fs.readFileSync('game.js','utf8');
new vm.Script(game);
const html=fs.readFileSync('index.html','utf8');
for (const id of ['board','startGame','gameMode','playerCount','exportGameJson','exportGameCsv']) { if(!html.includes(`id="${id}"`)) throw new Error(`ID manquant: ${id}`); }
const match=game.match(/const WINNING_PATTERNS = (\[[\s\S]*?\]);/);
if(!match) throw new Error('Motifs gagnants introuvables');
const patterns=vm.runInNewContext(match[1]);
if(patterns.length*2!==5816) throw new Error(`Configurations: ${patterns.length*2}`);
if(!fs.existsSync('assets/piece-move.mp3')||!fs.existsSync('assets/victory.mp3')) throw new Error('Sons manquants');
console.log(`OK V48: ${patterns.length} motifs, ${patterns.length*2} configurations.`);
