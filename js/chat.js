(function() {
  'use strict';
  const SUGS = [
    "Légionelles dans les établissements thermaux",
    "Synthèse sur l'entartrage des réseaux",
    "Radioactivité et radon : que dit l'AFTh ?",
    "Décarbonation des établissements thermaux",
    "Contrôle sanitaire de l'eau thermale",
    "Boues thermales : réglementation"
  ];
  let isOpen=false, isLoading=false, history=[];
  const launcher=document.getElementById('chat-launcher-btn');
  const win=document.getElementById('chat-win');
  const closeBtn=document.getElementById('chat-close-btn');
  const msgs=document.getElementById('chat-messages');
  const input=document.getElementById('chat-input');
  const send=document.getElementById('chat-send-btn');
  const sugs=document.getElementById('chat-sugs');
  if(!launcher) return;

  function init() {
    SUGS.slice(0,4).forEach(s=>{
      const b=document.createElement('button');
      b.className='chat-sug'; b.textContent=s;
      b.addEventListener('click',()=>sendMsg(s));
      sugs?.appendChild(b);
    });
    fetch('/api/stats').then(r=>r.json()).then(d=>{
      addMsg('ai',`Bonjour 👋 Je suis l'assistant IA de l'**AFTh**.\n\nJ'ai accès à **${d.totalArticles} articles techniques** et **${d.totalBulletins} bulletins** (${d.yearsRange?.min||2004}–${d.yearsRange?.max||2025}).\n\nPosez-moi votre question ou cliquez sur une suggestion.`);
    }).catch(()=>{
      addMsg('ai',`Bonjour 👋 Je suis l'assistant IA de l'**AFTh**.\n\nJ'explore les archives techniques 2004–2025 (150+ articles, 22 bulletins).\n\nQuelle est votre question ?`);
    });
    launcher.addEventListener('click',toggleChat);
    closeBtn?.addEventListener('click',closeChat);
    send?.addEventListener('click',()=>sendMsg());
    input?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}});
    input?.addEventListener('input',resize);
    document.addEventListener('click',e=>{
      if(isOpen&&!win.contains(e.target)&&!launcher.contains(e.target)) closeChat();
    });
  }

  function toggleChat(){isOpen?closeChat():openChat();}
  function openChat(){isOpen=true;win.classList.add('open');win.setAttribute('aria-hidden','false');setTimeout(()=>input?.focus(),300);}
  function closeChat(){isOpen=false;win.classList.remove('open');win.setAttribute('aria-hidden','true');}
  function resize(){if(!input)return;input.style.height='auto';input.style.height=Math.min(input.scrollHeight,100)+'px';}

  function md(text){
    return text
      .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.*?)\*/g,'<em>$1</em>')
      .replace(/^### (.*)/gm,'<h4>$1</h4>')
      .replace(/^## (.*)/gm,'<h3>$1</h3>')
      .replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br>')
      .replace(/^/,'<p>').replace(/$/,'</p>');
  }

  function addMsg(role,content){
    const w=document.createElement('div');
    w.className=`msg msg-${role==='user'?'user':'ai'}`;
    const av=document.createElement('div');av.className='msg-avatar';av.textContent=role==='user'?'👤':'🌊';
    const b=document.createElement('div');b.className='msg-bubble';b.innerHTML=md(content);
    w.appendChild(av);w.appendChild(b);msgs.appendChild(w);scrollDown();return b;
  }
  function addTyping(){
    const el=document.createElement('div');el.className='msg msg-ai';el.id='msg-typing';
    el.innerHTML='<div class="msg-avatar">🌊</div><div class="msg-bubble"><div class="typing"><span></span><span></span><span></span></div></div>';
    msgs.appendChild(el);scrollDown();
  }
  function removeTyping(){document.getElementById('msg-typing')?.remove();}
  function scrollDown(){msgs.scrollTop=msgs.scrollHeight;}

  async function sendMsg(text){
    const content=text||input?.value.trim();
    if(!content||isLoading) return;
    addMsg('user',content);
    history.push({role:'user',content});
    if(!text&&input){input.value='';input.style.height='auto';}
    isLoading=true;if(send)send.disabled=true;addTyping();
    try{
      const res=await fetch('/api/chat',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({messages:history})
      });
      removeTyping();
      if(!res.ok){
        const e=await res.json().catch(()=>({error:`HTTP ${res.status}`}));
        throw new Error(e.error||'Erreur serveur');
      }
      const bubble=addMsg('ai','');
      let full='';
      const reader=res.body.getReader(),dec=new TextDecoder();
      let buf='';
      while(true){
        const{done,value}=await reader.read();
        if(done) break;
        buf+=dec.decode(value,{stream:true});
        const lines=buf.split('\n');buf=lines.pop()||'';
        for(const line of lines){
          if(!line.startsWith('data: ')) continue;
          try{
            const d=JSON.parse(line.slice(6));
            if(d.type==='text'){full+=d.text;bubble.innerHTML=md(full)+'<span class="cursor">▌</span>';scrollDown();}
            else if(d.type==='done'){bubble.innerHTML=md(full);}
            else if(d.type==='error'){throw new Error(d.message);}
          }catch(_){}
        }
      }
      if(!full) full='Désolé, aucune réponse générée.';
      bubble.innerHTML=md(full);
      history.push({role:'assistant',content:full});
    }catch(err){
      removeTyping();
      let msg='⚠️ ';
      if(err.message.includes('API_KEY')||err.message.includes('configurée'))
        msg+='Clé API Anthropic non configurée. Ajoutez `ANTHROPIC_API_KEY` dans `.env` et relancez `npm start`.';
      else if(err.message.includes('fetch')||err.message.includes('Failed'))
        msg+='Serveur inaccessible. Vérifiez que `npm start` est lancé.';
      else msg+=err.message;
      addMsg('ai',msg);
    }finally{isLoading=false;if(send)send.disabled=false;}
  }

  document.readyState==='loading'
    ?document.addEventListener('DOMContentLoaded',init):init();
})();
