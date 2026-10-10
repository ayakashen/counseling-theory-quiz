const form=document.querySelector('#quiz'),status=document.querySelector('#status'),submit=document.querySelector('#submit'),result=document.querySelector('#results');
let requestId=null,submitted=false;
function answers(){return Array.from({length:20},(_,i)=>form.querySelector('input[name="q'+(i+1)+'"]:checked')?.value||'');}
form.addEventListener('change',()=>{const count=answers().filter(Boolean).length;document.querySelector('#count').textContent='已作答 '+count+' / 20';document.querySelector('#progress').value=count;requestId=null;});
form.addEventListener('input',()=>{requestId=null;});
form.addEventListener('submit',async event=>{
 event.preventDefault();if(submitted || submit.disabled)return;
 const candidate=document.querySelector('#candidate');
 if(!candidate.value.trim()){candidate.setCustomValidity('請輸入考生代號');candidate.reportValidity();return;}candidate.setCustomValidity('');
 const selected=answers(),missing=selected.findIndex(x=>!x);
 if(missing>=0){status.textContent='尚有 '+selected.filter(x=>!x).length+' 題未作答，請完成後再送出。';const first=form.querySelector('#question-'+(missing+1));first.scrollIntoView({behavior:'smooth',block:'center'});first.querySelector('input').focus({preventScroll:true});return;}
 if(!window.QUIZ_CONFIG?.endpoint){status.textContent='尚未完成 Google 試算表連線設定，請聯絡出題者。';return;}
 requestId=requestId || crypto.randomUUID();submit.disabled=true;submit.textContent='送出中…';status.textContent='正在儲存作答，請稍候。';
 const controls=Array.from(form.querySelectorAll('input'));controls.forEach(x=>x.disabled=true);
 try{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
  let response;try{response=await fetch(window.QUIZ_CONFIG.endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({candidate:candidate.value.trim(),answers:selected,requestId,schemaVersion:2}),redirect:'follow',signal:controller.signal});}finally{clearTimeout(timer);}
  if(!response.ok)throw new Error('伺服器暫時無法接收作答，請稍後再試。');
  const data=await response.json();if(!data.ok)throw new Error(data.message||'送出失敗。');
  if(data.schemaVersion!==2 || data.requestId!==requestId || !Number.isInteger(data.score) || data.score<0 || data.score>100 || !Array.isArray(data.results) || data.results.length!==20)throw new Error('回傳結果不完整，請重試。');
  submitted=true;status.textContent='作答已儲存至 Google 試算表。';submit.textContent='已送出';
  result.replaceChildren();const h=document.createElement('h2');h.textContent='作答結果';const score=document.createElement('p');score.className='score';score.textContent='總分 '+data.score+' / 100';result.append(h,score);
  const list=document.createElement('ol');list.className='result-list';
  data.results.forEach((r,i)=>{const li=document.createElement('li');li.className=r.correct?'correct':'incorrect';const title=document.createElement('strong');title.textContent='第 '+(i+1)+' 題 · '+(r.correct?'答對':'答錯');const text=document.createElement('span');text.textContent='你的作答：'+selected[i]+(r.correct?'':'　正確答案：'+r.correctAnswer);li.append(title,text);list.append(li);});result.append(list);result.hidden=false;result.focus();result.scrollIntoView({behavior:'smooth',block:'start'});
 }catch(error){status.textContent=error.name==='AbortError'?'送出逾時，請再按送出確認結果。':'未完成儲存：'+error.message;controls.forEach(x=>x.disabled=false);submit.disabled=false;submit.textContent='送出';}
});
document.querySelector('#candidate').addEventListener('input',e=>e.target.setCustomValidity(''));
