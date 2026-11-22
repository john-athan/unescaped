addEventListener('message', (e) => {
  if (e.source !== parent) return;
  document.open();
  document.write(e.data);
  document.close();
});
