useEffect(() => {
  const saved = localStorage.getItem('pending_property_form')
  if (saved) {
    const data = JSON.parse(saved)
    Object.entries(data).forEach(([key, value]) => {
      const input = document.querySelector(`[name="${key}"]`)
      if (input && 'value' in input) {
        input.value = value as string
      }
    })
  }
}, [])
