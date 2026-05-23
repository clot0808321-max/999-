console.log('888台灣商店前台已載入');

(function(){
  const search = document.getElementById('productSearch');
  if (!search) return;
  const items = Array.from(document.querySelectorAll('.bj-item'));
  const empty = document.getElementById('searchEmpty');
  search.addEventListener('input', function(){
    const keyword = this.value.trim().toLowerCase();
    let visible = 0;
    items.forEach(item => {
      const text = `${item.dataset.name || ''} ${item.dataset.desc || ''} ${item.dataset.cat || ''}`.toLowerCase();
      const match = !keyword || text.includes(keyword);
      item.style.display = match ? '' : 'none';
      if (match) visible++;
    });
    if (empty) empty.style.display = visible ? 'none' : 'block';
  });
})();
