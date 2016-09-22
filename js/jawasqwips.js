//TODO: make form stick when navbar touches top of it

$(document).ready(function(){
    var form_position = $('form').offset().top;

    $(document).scroll(function(){
        if ($(document).scrollTop() >= form_position - 80) {
            var form_container_width = $('.form-container').width();
            $('form').addClass('fixed').width(form_container_width);
        }
        else {
            $('form').removeClass('fixed');
        }
    });

    $('input[type="checkbox"]').click(function(){
        $(this).parents('li').addClass('complete');
    });

    $('i').click(function(){
       $(this).parents('li').remove(); 
    });

    $(function () {
      $('[data-toggle="tooltip"]').tooltip();
    })
});