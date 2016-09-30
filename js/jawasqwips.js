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

    $('body').on('click', 'input[type="checkbox"]', function(){
        var checked = $(this).is(':checked');
        var listItem = $(this).parents('li');
        completeTask(listItem, checked);
    });

    $('body').on('click', 'i', function(){
        var listItem = $(this).parents('li');

        if($(this).hasClass('fa-remove')) {
            deleteTask(listItem);
        }
        else if ($(this).hasClass('fa-pencil')) {
            $(this).parents('.task-display').fadeOut(400, function(){
                $(this).siblings('.task-edit').fadeIn();
            });
        }
        else if ($(this).hasClass('fa-undo')) {
            $(this).parents('.task-edit').fadeOut(400, function(){
                $(this).siblings('.task-display').fadeIn();
            });
        }
        else if ($(this).hasClass('fa-save')) {
            editTask(listItem);
        }
    });


    //============================== Task List action handlers ==================================================
    // Initialize firebase
    var fireDB = firebase.database();
    var new_task_id = '';
    var current_tasks = [$('#defaultTask').find('.task-text').text().toLowerCase()];

    function addTask(newTask)
    {
        var data = {
            description: newTask,
            complete: 0,
            deleted: 0
        };

        new_task_id = fireDB.ref().child('tasks').push().key;
        var promise = fireDB.ref('tasks/' + new_task_id).set(data);

        promise.then(function(value){
            //promise was fullfilled
            current_tasks.push(data.description.toLowerCase());
            $('input#newTask').val('');
            $('.task-added.alert-success').fadeIn();
            $('ul').append('<li data-task-id=' + new_task_id + '><div class="task-display"><span class="input-group-addon"><input type="checkbox" aria-label="task-complete"></span><span class="task-text">' + data.description + ' </span><i class="fa fa-pencil" data-toggle="tooltip" data-placement="top" title="Edit task"></i><i class="fa fa-remove" data-toggle="tooltip" data-placement="right" title="Remove task"></i></div><div class="task-edit" style="display:none;"><input type="text" name="edit-' + new_task_id + '" value="' + data.description + '" class="form-control"><span class="edit-icons"><i class="fa fa-undo" data-toggle="tooltip" data-placement="top" title="Undo"></i><i class="fa fa-save" data-toggle="tooltip" data-placement="right" title="Save task"></i></span></div></li>')
        }, function(error){
            //promise was rejected
            $('.task-added.alert-danger').fadeIn();
        });

        setTimeout(function(){ $('.alert').fadeOut('slow'); }, 2000);
    }

    function editTask(list_item)
    {
        var task_id = list_item.attr('data-task-id');
        var current_description = list_item.find('.task-text').text().toLowerCase().trim();
        var new_description = list_item.find('input[name="edit-' + task_id + '"]').val().replace(/<(?:.|\n)*?>/gm, '').trim();

        if(new_description != '') {
            var data = {description: new_description};
            var promise = fireDB.ref('tasks/' + task_id).update(data);
            var index = $.inArray(current_description, current_tasks);
            var exists = $.inArray(new_description, current_tasks);
            
            if(exists >= 0 && index != exists){
                //task already exists in current to-do list
                $('.task-update.alert-danger').html("<strong>Woops</strong>! Task already exists.").fadeIn();
                setTimeout(function(){ $('.alert').fadeOut('slow'); }, 2000);
            }
            else {
                promise.then(function(value){
                    //promise was fullfilled
                    current_tasks[index] = new_description.toLowerCase();
                    list_item.find('.task-edit').fadeOut(400, function(){
                        $(this).siblings('.task-display').find('.task-text').text(new_description);
                        $(this).siblings('.task-display').fadeIn();
                    });
                    $('.task-update.alert-success').html("<strong>Woot!</strong> Task edited successfully!").fadeIn();
                }, function(error){
                    //promise was rejected
                    $('.task-update.alert-danger').html("<strong>Woops</strong>! Unable to update task. Please try again.").fadeIn();
                });
            }
            setTimeout(function(){ $('.alert').fadeOut('slow'); }, 2000);
        }
        else {
            list_item.find('.task-edit').fadeOut(400, function(){
                $(this).siblings('.task-display').fadeIn();
                $(this).find('input').val(current_description);
            });
        }
    }

    // Utilizing soft-deletion
    function deleteTask(list_item)
    {
        var data = {deleted: 1};
        var task_id = list_item.attr('data-task-id');
        var promise = fireDB.ref('tasks/' + task_id).update(data);

        promise.then(function(value){
            //promise was fullfilled
            list_item.fadeOut('slow', function(){
                list_item.remove();
            });
            $('.task-update.alert-success').html("<strong>Woot!</strong> Task deleted successfully!").fadeIn();
        }, function(error){
            //promise was rejected
            $('.task-update.alert-danger').html("<strong>Woops</strong>! Unable to delete task. Please try again.").fadeIn();
        });

        setTimeout(function(){ $('.alert').fadeOut('slow'); }, 2000);
    }

    function completeTask(list_item, complete = false)
    {
        var task_id = list_item.attr('data-task-id');
        var data = {
            complete: complete ? 1 : 0
        }
        var promise = fireDB.ref('tasks/' + task_id).update(data);

        promise.then(function(value){
            //promise was fullfilled
            markComplete(list_item, complete);
        }, function(error){
            //promise was rejected
            $('.task-update.alert-danger').html("<strong>Woops</strong>! Unable to update task. Please try again.").fadeIn();
            setTimeout(function(){ $('.alert').fadeOut('slow'); }, 2000);
        });
    }

    function markComplete(list_item, complete) 
    {
        if (complete) {
            list_item.addClass('complete');
        }
        else {
            list_item.removeClass('complete');
        }
    }

    // Display all current tasks
    fireDB.ref('tasks').once('value').then(function(snapshot) {
        //loop through all tasks and append those that are not deleted
        $.each(snapshot.val(), function(task_id, task_obj){
            if(!task_obj.deleted) {
                current_tasks.push(task_obj.description.toLowerCase());
                $('ul').append('<li data-task-id=' + task_id + '><div class="task-display"><span class="input-group-addon"><input type="checkbox" aria-label="task-complete"></span><span class="task-text">' + task_obj.description + ' </span><i class="fa fa-pencil" data-toggle="tooltip" data-placement="top" title="Edit task"></i><i class="fa fa-remove" data-toggle="tooltip" data-placement="right" title="Remove task"></i></div><div class="task-edit" style="display:none;"><input type="text" name="edit-' + task_id + '" value="' + task_obj.description + '" class="form-control"><span class="edit-icons"><i class="fa fa-undo" data-toggle="tooltip" data-placement="top" title="Undo"></i><i class="fa fa-save" data-toggle="tooltip" data-placement="right" title="Save task"></i></span></div></li>')
                if(task_obj.complete){
                    $('li[data-task-id="' + task_id + '"]').addClass('complete').find('input').attr('checked', 'checked');
                }
            }
        });

        $('[data-toggle="tooltip"]').tooltip();
    });

    // Validate/Clean & submit new tasks
    $('form').submit(function(event){
        event.preventDefault();

        var newTask = $('input#newTask').val();
        // Strip tags
        newTask = newTask.replace(/<(?:.|\n)*?>/gm, '').trim();

        if(newTask != '') {
            if($.inArray(newTask.toLowerCase(), current_tasks) >= 0){
                //task already exists in current to-do list
                $('.task-update.alert-danger').html("<strong>Woops</strong>! Task already exists.").fadeIn();
                setTimeout(function(){ $('.alert').fadeOut('slow'); }, 2000);
            }
            else {
                addTask(newTask);
            }
        }
        
    });

});