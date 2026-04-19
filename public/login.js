$(function () {
    // ═══════════════════════════════════════════════════════
    //  SWITCHING PANELS  (Login ↔ Register)
    // ═══════════════════════════════════════════════════════
    const $loginCard     = $('#login-card');
    const $registerCard  = $('#register-card');
    const $successCard   = $('#success-card');
    const $panelTitle    = $('#panel-title');
    const $panelSub      = $('#panel-sub');
    let isRegistering    = false;

    $('#go-register').on('click', function (e) {
        e.preventDefault();
        isRegistering = true;
        
        $loginCard.removeClass('slide-in-left').addClass('slide-out-left');
        setTimeout(() => {
            $loginCard.addClass('hidden-form');
            $registerCard.removeClass('hidden-form slide-out-right').addClass('slide-in-right');
            
            // Update left panel text implicitly (just fade out/in effect without animating position)
            $panelTitle.text('Join MediShop');
            $panelSub.text('Get access to fast delivery, reliable medicines, and easy prescription uploads.');
        }, 220); // wait for slide-out
    });

    $('#go-login').on('click', function (e) {
        e.preventDefault();
        isRegistering = false;
        
        $registerCard.removeClass('slide-in-right').addClass('slide-out-right');
        setTimeout(() => {
            $registerCard.addClass('hidden-form');
            $loginCard.removeClass('hidden-form slide-out-left').addClass('slide-in-left');
            
            $panelTitle.text('Welcome Back!');
            $panelSub.text('Sign in to access your prescriptions, track orders, and reorder medicines instantly.');
        }, 220);
    });

    // ═══════════════════════════════════════════════════════
    //  PASSWORD TOGGLE
    // ═══════════════════════════════════════════════════════
    $('.toggle-pass').on('click', function () {
        const targetId = $(this).data('target');
        const $input   = $('#' + targetId);
        const $icon    = $(this).find('i');

        if ($input.attr('type') === 'password') {
            $input.attr('type', 'text');
            $icon.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            $input.attr('type', 'password');
            $icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    });

    // ═══════════════════════════════════════════════════════
    //  PASSWORD STRENGTH METER
    // ═══════════════════════════════════════════════════════
    $('#reg-pass').on('input', function () {
        const val = $(this).val();
        let strength = 0;
        let color = '#E2E8F0';
        let label = 'Too short';

        if (val.length >= 6) strength += 25;
        if (val.match(/[A-Z]/)) strength += 25;
        if (val.match(/[0-9]/)) strength += 25;
        if (val.match(/[^A-Za-z0-9]/)) strength += 25;

        if (val.length === 0) {
            strength = 0;
            label = '';
        } else if (strength <= 25) {
            color = '#DC2626'; // Red
            label = 'Weak';
        } else if (strength <= 50) {
            color = '#D97706'; // Orange
            label = 'Fair';
        } else if (strength <= 75) {
            color = '#2563EB'; // Blue
            label = 'Good';
        } else {
            color = '#059669'; // Green
            label = 'Strong';
        }

        $('#strength-fill').css({ 'width': strength + '%', 'background': color });
        $('#strength-label').text(label).css('color', color);
    });

    // ═══════════════════════════════════════════════════════
    //  VALIDATION HELPERS
    // ═══════════════════════════════════════════════════════
    function showError($input, $err, msg) {
        $input.removeClass('is-ok').addClass('is-err shake');
        setTimeout(() => $input.removeClass('shake'), 400); // remove shake class after anim
        $err.text(msg);
    }
    function clearError($input, $err) {
        $input.removeClass('is-err').addClass('is-ok');
        $err.text('');
    }
    function resetField($input, $err) {
        $input.removeClass('is-err is-ok');
        $err.text('');
    }
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // ═══════════════════════════════════════════════════════
    //  LOGIN FORM SUBMIT
    // ═══════════════════════════════════════════════════════
    $('#login-card').on('submit', function (e) {
        e.preventDefault();
        const email = $('#login-email').val().trim();
        const pass  = $('#login-pass').val();
        let valid   = true;

        if (!isValidEmail(email)) { showError($('#login-email'), $('#login-email-err'), 'Enter a valid email.'); valid = false; }
        else                      { clearError($('#login-email'), $('#login-email-err')); }

        if (!pass) { showError($('#login-pass'), $('#login-pass-err'), 'Password is required.'); valid = false; }
        else       { clearError($('#login-pass'), $('#login-pass-err')); }

        if (!valid) return;

        // Simulate API call
        const $btn = $('#login-submit');
        $btn.addClass('loading').prop('disabled', true);
        $btn.find('.btn-text').addClass('hidden');
        $btn.find('.btn-loader').removeClass('hidden');

        setTimeout(() => {
            // Success logic -> redirect to home
            window.location.href = '/';
        }, 1500);
    });

    // ═══════════════════════════════════════════════════════
    //  REGISTER FORM SUBMIT (Animated Success)
    // ═══════════════════════════════════════════════════════
    $('#register-card').on('submit', function (e) {
        e.preventDefault();
        const name  = $('#reg-name').val().trim();
        const email = $('#reg-email').val().trim();
        const pass  = $('#reg-pass').val();
        const conf  = $('#reg-confirm').val();
        const terms = $('#reg-terms').is(':checked');
        let valid   = true;

        if (!name) { showError($('#reg-name'), $('#reg-name-err'), 'Name is required.'); valid = false; }
        else       { clearError($('#reg-name'), $('#reg-name-err')); }

        if (!isValidEmail(email)) { showError($('#reg-email'), $('#reg-email-err'), 'Enter a valid email.'); valid = false; }
        else                      { clearError($('#reg-email'), $('#reg-email-err')); }

        if (pass.length < 6) { showError($('#reg-pass'), $('#reg-pass-err'), 'Must be at least 6 characters.'); valid = false; }
        else                 { clearError($('#reg-pass'), $('#reg-pass-err')); }

        if (conf !== pass || !conf) { showError($('#reg-confirm'), $('#reg-confirm-err'), 'Passwords do not match.'); valid = false; }
        else                        { clearError($('#reg-confirm'), $('#reg-confirm-err')); }

        if (!terms) { 
            $('#register-alert').text('Please agree to the Terms of Service.').addClass('error').removeClass('hidden');
            valid = false;
        } else {
            $('#register-alert').addClass('hidden');
        }

        if (!valid) return;

        // Simulate API call for Registration
        const $btn = $('#register-submit');
        $btn.addClass('loading').prop('disabled', true);
        $btn.find('.btn-text').addClass('hidden');
        $btn.find('.btn-loader').removeClass('hidden');

        setTimeout(() => {
            // Transition to Success Card animation
            $registerCard.removeClass('slide-in-right').addClass('slide-out-right');
            setTimeout(() => {
                $registerCard.addClass('hidden-form');
                
                // Show success
                const firstName = name.split(' ')[0] || 'there';
                $('#welcome-name').text(firstName);
                $successCard.removeClass('hidden-form');
                
                // Redirect after success animation plays for a bit
                setTimeout(() => {
                    window.location.href = '/';
                }, 3500); // Wait for the checkmark to finish and look nice
            }, 250); // slide out duration
        }, 1500); // mock network delay
    });

    // Clear alerts when typing
    $('input').on('keydown', function() {
        $('#login-alert, #register-alert').addClass('hidden');
    });
});

function demoSocialLogin() {
    alert("Social login is a demo. Please use the email/password forms.");
}
