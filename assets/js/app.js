
(function(){
  const app = document.getElementById('appShell');
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenuButton = document.getElementById('mobileMenuButton');
  const contentWrap = document.getElementById('contentWrap');
  const links = Array.from(document.querySelectorAll('.sidebar-link[href^="#"]'));
  const groups = Array.from(document.querySelectorAll('.sidebar-nav details'));

  function isMobile(){
    return window.matchMedia('(max-width: 900px)').matches;
  }

  function syncInitialMenu(){
    if(isMobile()){
      app.classList.remove('menu-open');
    }else{
      app.classList.add('menu-open');
    }
  }

  function toggleMenu(){
    app.classList.toggle('menu-open');
  }

  if(menuToggle) menuToggle.addEventListener('click', toggleMenu);
  if(mobileMenuButton) mobileMenuButton.addEventListener('click', toggleMenu);

  document.getElementById('expandAllNav')?.addEventListener('click', () => {
    groups.forEach(d => d.open = true);
  });

  document.getElementById('collapseAllNav')?.addEventListener('click', () => {
    groups.forEach(d => d.open = false);
  });

  links.forEach(a => {
    a.addEventListener('click', () => {
      if(isMobile()) app.classList.remove('menu-open');
    });
  });

  // Avoid accidental navigation when clicking a summary link while using the twisty area.
  document.querySelectorAll('.sidebar-nav summary a').forEach(a => {
    a.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });

  function setActive(){
    let current = '';
    const offset = isMobile() ? 90 : 120;
    const scrollTop = isMobile()
      ? window.scrollY
      : contentWrap.scrollTop;
    const candidates = links
      .map(a => {
        const id = decodeURIComponent(a.getAttribute('href').slice(1));
        const el = document.getElementById(id);
        if(!el) return null;
        const top = isMobile()
          ? el.getBoundingClientRect().top + window.scrollY
          : el.offsetTop;
        return {href:a.getAttribute('href'), top};
      })
      .filter(Boolean)
      .sort((a,b)=>a.top-b.top);

    for(const c of candidates){
      if(c.top <= scrollTop + offset) current = c.href;
    }

    links.forEach(a => {
      a.classList.toggle('active', current && a.getAttribute('href') === current);
    });
  }

  syncInitialMenu();
  setActive();

  window.addEventListener('resize', syncInitialMenu);
  window.addEventListener('scroll', setActive, {passive:true});
  contentWrap?.addEventListener('scroll', setActive, {passive:true});
})();



(function(){
  function setVisualDetails(selector, open){
    const root = document.querySelector(selector);
    if(!root) return;
    root.querySelectorAll('details.visual-fold').forEach(d => d.open = open);
  }
  document.querySelectorAll('[data-visual-open]').forEach(btn => {
    btn.addEventListener('click', () => setVisualDetails(btn.getAttribute('data-visual-open'), true));
  });
  document.querySelectorAll('[data-visual-close]').forEach(btn => {
    btn.addEventListener('click', () => setVisualDetails(btn.getAttribute('data-visual-close'), false));
  });
})();


(function(){
  const article = document.querySelector('.content-card');
  if(!article) return;

  const isEnglish = document.documentElement.lang && document.documentElement.lang.toLowerCase().startsWith('en');
  const labels = isEnglish
    ? {
        expand:'Expand all headings',
        collapse:'Collapse all headings',
        anchor:'Direct link to this section'
      }
    : {
        expand:'Tout déplier les titres',
        collapse:'Tout replier les titres',
        anchor:'Lien direct vers cette section'
      };

  const headingSelector = 'h1, h2, h3, h4, h5';
  const getLevel = (el) => Number(el.tagName.slice(1));
  const isFoldHeading = (el) => el.matches(headingSelector) && !el.closest('.sidebar, .sidebar-nav, .heading-tools, details > summary');
  const uid = () => 'fold-' + Math.random().toString(36).slice(2, 9);

  function slugify(text){
    return (text || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/&/g, ' et ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 72);
  }

  function ensureHeadingId(heading){
    if(heading.id) return heading.id;
    const base = slugify(heading.textContent) || uid();
    let id = base;
    let i = 2;
    while(document.getElementById(id)){
      id = `${base}-${i++}`;
    }
    heading.id = id;
    return id;
  }

  function updateHeadingState(heading, body, open){
    const button = heading.querySelector(':scope > .heading-fold-toggle');
    if(!button || !body) return;
    body.hidden = !open;
    heading.classList.toggle('is-collapsed', !open);
    button.setAttribute('aria-expanded', String(open));
  }

  function openHeading(heading){
    const body = heading?.nextElementSibling;
    if(!heading || !body || !body.classList.contains('heading-fold-body')) return;
    updateHeadingState(heading, body, true);
  }

  function openAncestorsForTarget(target){
    let node = target;
    while(node && node !== article){
      const body = node.closest?.('.heading-fold-body');
      if(!body) break;
      const heading = body.previousElementSibling;
      openHeading(heading);
      node = heading;
    }
    if(target?.classList?.contains('fold-heading')) openHeading(target);
  }

  function buildHeadingFold(heading){
    if(heading.classList.contains('fold-heading')) return;
    const headingId = ensureHeadingId(heading);
    const level = getLevel(heading);
    const body = document.createElement('div');
    body.className = `heading-fold-body heading-fold-level-${level}`;
    body.id = `${headingId}-content`;

    let next = heading.nextSibling;
    while(next){
      if(next.nodeType === Node.ELEMENT_NODE && isFoldHeading(next) && getLevel(next) <= level) break;
      const move = next;
      next = next.nextSibling;
      body.appendChild(move);
    }
    heading.after(body);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'heading-fold-toggle';
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-controls', body.id);

    const icon = document.createElement('span');
    icon.className = 'heading-fold-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '▸';

    const title = document.createElement('span');
    title.className = 'heading-title';
    while(heading.firstChild) title.appendChild(heading.firstChild);

    const anchor = document.createElement('a');
    anchor.className = 'heading-direct-anchor';
    anchor.href = `#${encodeURIComponent(headingId)}`;
    anchor.title = labels.anchor;
    anchor.setAttribute('aria-label', labels.anchor);
    anchor.textContent = '#';
    anchor.addEventListener('click', (event) => {
      event.stopPropagation();
      openAncestorsForTarget(heading);
    });

    button.append(icon, title);
    heading.append(button, anchor);
    heading.classList.add('fold-heading');

    button.addEventListener('click', () => {
      updateHeadingState(heading, body, body.hidden);
    });
  }

  function buildAllFolds(){
    for(let level = 5; level >= 1; level--){
      Array.from(article.querySelectorAll(`h${level}`))
        .filter(isFoldHeading)
        .forEach(buildHeadingFold);
    }
  }

  function setAllHeadings(open){
    article.querySelectorAll('.fold-heading').forEach(heading => {
      const body = heading.nextElementSibling;
      if(!body || !body.classList.contains('heading-fold-body')) return;
      updateHeadingState(heading, body, open);
    });
  }

  function insertTools(){
    if(article.querySelector('.heading-tools')) return;
    const tools = document.createElement('div');
    tools.className = 'heading-tools';
    tools.innerHTML = `<button type="button" data-heading-expand>${labels.expand}</button><button type="button" data-heading-collapse>${labels.collapse}</button>`;
    const hero = article.querySelector('header.hero');
    if(hero) hero.insertAdjacentElement('afterend', tools);
    else article.prepend(tools);
    tools.querySelector('[data-heading-expand]')?.addEventListener('click', () => setAllHeadings(true));
    tools.querySelector('[data-heading-collapse]')?.addEventListener('click', () => setAllHeadings(false));
  }

  function openHashTarget(){
    if(!window.location.hash) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    const target = document.getElementById(id);
    if(!target) return;
    openAncestorsForTarget(target);
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('a[href^="#"]');
    if(!link) return;
    const id = decodeURIComponent(link.getAttribute('href').slice(1));
    const target = document.getElementById(id);
    if(target) openAncestorsForTarget(target);
  });

  buildAllFolds();
  insertTools();
  openHashTarget();
  window.addEventListener('hashchange', openHashTarget);

  // Always print the complete guide, even if headings are collapsed on screen.
  window.addEventListener('beforeprint', () => setAllHeadings(true));
})();
