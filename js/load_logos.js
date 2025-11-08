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
        let logoIndex = 0;

        if (logos.institutionLogo && logoCircles[logoIndex]) {
            const img = new Image();
            img.src = `data:image/jpeg;base64,${logos.institutionLogo}`;
            img.alt = data.institution;
            img.className = 'logo-image';
            img.onload = function() {
                logoCircles[logoIndex].innerHTML = '';
                logoCircles[logoIndex].appendChild(img);
                logoCircles[logoIndex].classList.remove('loading-circle');
            };
            logoIndex++;
        } else if (logoCircles[logoIndex]) {
            logoCircles[logoIndex].remove();
        }

        if (logos.associationLogo && logoCircles[logoIndex]) {
            const img = new Image();
            img.src = logos.associationLogo; // Already a data URL from database
            img.alt = 'Association Logo';
            img.className = 'logo-image';
            img.onload = function() {
                logoCircles[logoIndex].innerHTML = '';
                logoCircles[logoIndex].appendChild(img);
                logoCircles[logoIndex].classList.remove('loading-circle');
            };
        } else if (logoCircles[logoIndex]) {
            logoCircles[logoIndex].remove();
        }
    })
    .catch(error => {
        console.error('Error loading logos:', error);
        document.querySelectorAll('.logo-circle').forEach(circle => {
            circle.remove();
        });
    });
}