/* Contact page form. Checks the required fields, then posts the form as JSON to
   /api/contact (index.mjs contactRequest) and swaps the form for a confirmation. */
(function(){
  var form = document.getElementById('contactForm'), done = document.getElementById('formDone'), msg = document.getElementById('formMsg');
  var btn  = form.querySelector('[type="submit"]'), label = btn.textContent;

  function check () {
    var first = null;
    form.querySelectorAll('[required]').forEach(function(el){
      var bad = el.type === 'checkbox' ? !el.checked
              : el.type === 'email'    ? !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value.trim())
              :                          !el.value.trim();
      (el.type === 'checkbox' ? el.closest('label') : el).classList.toggle('invalid', bad);
      el.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (bad && !first) first = el;
    });
    if (first) first.focus();
    return !first;
  }
  function fail (text) { msg.textContent = text; msg.hidden = false }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    msg.hidden = true;
    if (!check()) return fail('Please complete the fields marked *.');
    btn.textContent = 'Sending…'; btn.disabled = true;
    fetch('/api/contact', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(Object.fromEntries(new FormData(form)))})
      .then(function(res){
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.hidden = true; done.style.display = 'block';
      })
      .catch(function(){
        btn.textContent = label; btn.disabled = false;
        fail('Something went wrong. Please try again, or email us directly.');
      });
  });
  form.addEventListener('input', function(e){ if (e.target.getAttribute('aria-invalid') === 'true') { e.target.classList.remove('invalid'); e.target.closest('label') && e.target.closest('label').classList.remove('invalid'); e.target.setAttribute('aria-invalid', 'false') } });
})();
