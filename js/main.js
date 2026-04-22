document.addEventListener('DOMContentLoaded', function() {

  // Navbar scroll + scroll top
  const navbar=document.querySelector('.navbar');
  const scrollBtn=document.querySelector('.scroll-top');
  window.addEventListener('scroll',()=>{
    navbar?.classList.toggle('scrolled',scrollY>40);
    scrollBtn?.classList.toggle('show',scrollY>400);
  },{passive:true});
  scrollBtn?.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));

  // Burger
  const burger=document.getElementById('burger');
  const navMenu=document.querySelector('.nav-menu');
  burger?.addEventListener('click',()=>{
    navMenu?.classList.toggle('open');
    burger.setAttribute('aria-expanded',navMenu?.classList.contains('open'));
  });
  navMenu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>navMenu.classList.remove('open')));

  // Active link
  const path=location.pathname.replace(/\/$/,'')||'/';
  document.querySelectorAll('.nav-menu a[href]').forEach(a=>{
    const href=a.getAttribute('href');
    if(href&&!href.startsWith('#')&&!href.startsWith('http')){
      if(href==='/'?path==='/':path.startsWith(href)) a.classList.add('active');
    }
  });

  // Nav IA → chat
  document.getElementById('nav-ai-btn')?.addEventListener('click',e=>{
    e.preventDefault();document.getElementById('chat-launcher-btn')?.click();
  });
  document.getElementById('open-ia-btn')?.addEventListener('click',e=>{
    e.preventDefault();document.getElementById('chat-launcher-btn')?.click();
  });

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',function(e){
      const href=this.getAttribute('href');
      if(href==='#') return;
      const t=document.querySelector(href);
      if(t){e.preventDefault();scrollTo({top:t.offsetTop-82,behavior:'smooth'});}
    });
  });

  // Image fallback
  document.querySelectorAll('img[src]').forEach(img=>{
    img.addEventListener('error',function(){this.style.display='none';},{once:true});
  });

  // === Recherche articles (/articles) ===
  const searchInput=document.getElementById('search-input');
  const resultsList=document.getElementById('articles-list');
  const countEl=document.getElementById('articles-count');
  const filtersEl=document.getElementById('filters-dynamic');

  if(searchInput&&resultsList){
    let activeTheme='all',debounce;

    function render(arts){
      if(countEl) countEl.textContent=`${arts.length} article${arts.length!==1?'s':''}`;
      if(!arts.length){
        resultsList.innerHTML='<p style="text-align:center;color:var(--c-text-lt);padding:2rem;">Aucun article trouvé.</p>';
        return;
      }
      resultsList.innerHTML=arts.map(a=>`
        <div class="article-item">
          <span class="art-theme">${a.theme||'Technique'}</span>
          <div class="art-info">
            <a class="art-title" href="/article/${a.id}">${a.title}</a>
            ${a.excerpt?`<p class="art-excerpt">${a.excerpt.substring(0,200)}</p>`:''}
          </div>
          ${a.year?`<span class="art-year">${a.year}</span>`:''}
        </div>`).join('');
    }

    function doSearch(){
      const q=searchInput.value.trim();
      fetch(`/api/search?limit=300&q=${encodeURIComponent(q)}`)
        .then(r=>r.json())
        .then(data=>{
          let res=data.results;
          if(activeTheme!=='all') res=res.filter(a=>a.theme===activeTheme);
          render(res);
        })
        .catch(()=>{
          resultsList.innerHTML='<p style="text-align:center;color:var(--c-text-lt);padding:2rem;">⚠️ Lancez <code>npm start</code> pour accéder aux articles.</p>';
        });
    }

    if(filtersEl){
      fetch('/api/stats').then(r=>r.json()).then(data=>{
        Object.entries(data.themes).sort((a,b)=>b[1]-a[1]).slice(0,12).forEach(([theme,count])=>{
          const btn=document.createElement('button');
          btn.className='filter-btn';btn.dataset.theme=theme;
          btn.textContent=`${theme} (${count})`;
          btn.addEventListener('click',function(){
            document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
            this.classList.add('active');activeTheme=theme;doSearch();
          });
          filtersEl.appendChild(btn);
        });
      }).catch(()=>{});
    }

    document.querySelectorAll('.filter-btn[data-theme="all"]').forEach(btn=>{
      btn.addEventListener('click',function(){
        document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
        this.classList.add('active');activeTheme='all';doSearch();
      });
    });

    searchInput.addEventListener('input',()=>{clearTimeout(debounce);debounce=setTimeout(doSearch,350);});
    doSearch();
  }

  // Contact form
  document.getElementById('contact-form')?.addEventListener('submit',function(e){
    e.preventDefault();
    const btn=this.querySelector('[type="submit"]');
    btn.textContent='✓ Message envoyé !';btn.style.background='var(--c-success)';btn.disabled=true;
    setTimeout(()=>{btn.textContent='Envoyer';btn.style.background='';btn.disabled=false;this.reset();},4000);
  });
});
