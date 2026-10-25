(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 제목 등장
  const reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    reveals.forEach((el) => io.observe(el));
  }

  // 떠 있는 사진: 스크롤 깊이만큼 조금씩 더 움직임
  const floats = [...document.querySelectorAll('.float')];
  if (!reduceMotion && floats.length) {
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      floats.forEach((el) => {
        const speed = Number(el.dataset.speed) || 0.05;
        el.style.transform = `translate3d(0, ${y * speed * -1}px, 0)`;
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
  }

  // 문의 폼 보내기
  const form = document.getElementById('inquiry-form');
  if (!form) return;
  const msg = form.querySelector('.form__msg');

  const setError = (text, field) => {
    msg.textContent = text;
    msg.classList.add('is-error');
    if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
  };

  form.addEventListener('input', (e) => {
    if (e.target.hasAttribute('aria-invalid')) e.target.removeAttribute('aria-invalid');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    msg.classList.remove('is-error');

    const name = form.elements.name;
    const contact = form.elements.contact;
    const consent = form.elements.consent;
    if (!name.value.trim()) return setError('이름을 적어 주세요.', name);
    if (!contact.value.trim()) return setError('연락처를 적어 주세요.', contact);
    if (!consent.checked) return setError('개인정보 수집·이용에 동의해 주세요.', consent);

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = '보내는 중…';
    try {
      const r = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.value,
          contact: contact.value,
          preferred_date: form.elements.preferred_date.value,
          website: form.elements.website.value,
          consent: consent.checked,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || '보내지 못했어요. 잠시 뒤 다시 시도해 주세요.');
      form.reset();
      form.classList.add('is-done');
      msg.textContent = '문의가 접수됐어요. 확인 후 연락드릴게요.';
    } catch (err) {
      setError(err.message || '보내지 못했어요. 잠시 뒤 다시 시도해 주세요.');
    } finally {
      button.disabled = false;
      button.textContent = '문의 보내기';
    }
  });
})();
