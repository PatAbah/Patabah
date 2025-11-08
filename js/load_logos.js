function loadLogos(data) {
    fetch('/getlogos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            institution: data.institution,
            associationId: data.associationId,
            arn: data.arn
        })
    })
    .then(response => response.json())
    .then(logos => {
        const logoCircles = document.querySelectorAll('.logo-circle');
        
        if (logos.institutionLogo && logoCircles[0]) {
            logoCircles[0].innerHTML = `<img src="${logos.institutionLogo}" alt="${data.institution}" class="logo-image">`;
            logoCircles[0].classList.remove('loading-circle');
        }
        
        if (logos.associationLogo && logoCircles[1]) {
            logoCircles[1].innerHTML = `<img src="${logos.associationLogo}" alt="Association Logo" class="logo-image">`;
            logoCircles[1].classList.remove('loading-circle');
        }
    })
    .catch(error => {
        console.error('Error loading logos:', error);
        // Remove loading spinners on error
        document.querySelectorAll('.loading-circle').forEach(circle => {
            circle.innerHTML = '';
            circle.classList.remove('loading-circle');
        });
    });
}