function loadLogos(data) {
    fetch('/getlogos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            institution: data.institution,
            associationId: data.associationId
        })
    })
    .then(response => response.json())
    .then(logos => {
        const logoCircles = document.querySelectorAll('.logo-circle');
        
        if (logos.institutionLogo && logoCircles[0]) {
            const img = document.createElement('img');
            img.src = logos.institutionLogo;
            img.alt = data.institution;
            img.className = 'logo-image';
            logoCircles[0].innerHTML = '';
            logoCircles[0].appendChild(img);
            logoCircles[0].classList.remove('loading-circle');
        } else if (logoCircles[0]) {
            logoCircles[0].remove();
        }

        if (logos.associationLogo && logoCircles[1]) {
            const img = document.createElement('img');
            img.src = logos.associationLogo;
            img.alt = 'Association Logo';
            img.className = 'logo-image';
            logoCircles[1].innerHTML = '';
            logoCircles[1].appendChild(img);
            logoCircles[1].classList.remove('loading-circle');
        } else if (logoCircles[1]) {
            logoCircles[1].remove();
        }
    })
    .catch(error => {
        document.querySelectorAll('.logo-circle').forEach(circle => {
            circle.remove();
        });
    });
}