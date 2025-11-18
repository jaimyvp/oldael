(function () {
  const activitySelect = document.getElementById('activity_type');
  const hoursGroup = document.getElementById('hoursGroup');

  function toggleHours() {
    if (!activitySelect || !hoursGroup) return;
    const isOplevering = activitySelect.value === 'OPLEVERINGSSCHOONMAAK';
    hoursGroup.style.display = isOplevering ? 'flex' : 'none';
  }

  if (activitySelect) {
    toggleHours();
    activitySelect.addEventListener('change', toggleHours);
  }
})();
