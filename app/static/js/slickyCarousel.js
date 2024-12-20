$(document).ready(function () {
    // Initialize the carousel
    var $carousel = $('.my-carousel').slick({
        slidesToShow: 5,
        slidesToScroll: 5,
        fade: false,
        cssEase: 'linear',
        arrows: false,  // Disable default arrows
        dots: false     // Disable dots
    });

    // Custom button functionality
    $('.custom-prev').on('click', function () {
        $carousel.slick('slickPrev');  // Go to previous slide
    });

    $('.custom-next').on('click', function () {
        $carousel.slick('slickNext');  // Go to next slide
    });
});
