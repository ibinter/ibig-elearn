const a=require('./strings.json');const [from,to]=process.argv.slice(2).map(Number);
let prev='';for(let i=from;i<Math.min(to,a.length);i++){const f=a[i].f.replace(/^src\/(app\/)?/,'');if(f!==prev){console.log('## '+f);prev=f}console.log(i+'\t'+a[i].s.replace(/\t/g,' '))}
