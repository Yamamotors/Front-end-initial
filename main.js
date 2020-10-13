window.addEventListener('scroll', function(){
    const logoImage = document.querySelector('.logo img');
    const mainNav = document.getElementById("mainNav");

    if(window.pageYOffset > 22){
        logoImage.style.height = "33px";
        mainNav.classList.add('bg.black');
        mainNav.classList.add('txt-white');
    } else {
        logoImage.style.height = "77px";
        mainNav.classList.remove('bg.black');
        mainNav.classList.remove('txt-white');
    }
});