package com.example.studylab;

import android.content.Intent;
import android.os.Bundle;
import android.text.SpannableString;
import android.text.Spanned;
import android.text.TextUtils;
import android.text.style.ClickableSpan;
import android.text.style.ForegroundColorSpan;
import android.text.method.LinkMovementMethod;
import android.util.Patterns;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import com.example.studylab.api.ApiClient;
import com.example.studylab.api.AuthResponse;
import com.example.studylab.api.Mentor;
import com.example.studylab.api.MentorListResponse;
import com.example.studylab.api.RegisterRequest;
import com.example.studylab.api.SessionManager;
import com.google.android.material.button.MaterialButton;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONObject;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class register extends AppCompatActivity {

    private EditText nameField, emailField, passwordField;
    private CheckBox termsCheckbox;
    private Spinner mentorSpinner;
    private MaterialButton registerButton;
    private ProgressBar registerProgress;
    private SessionManager sessionManager;

    /** Index 0 of mentorSpinner is the "no mentor" placeholder, so the
     *  list is offset by one. Keep them in sync via loadMentors(). */
    private final List<Mentor> mentors = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.register_activity);

        sessionManager   = new SessionManager(this);
        nameField        = findViewById(R.id.name_edittext);
        emailField       = findViewById(R.id.email_edittext);
        passwordField    = findViewById(R.id.password_edittext);
        termsCheckbox    = findViewById(R.id.cb_terms);
        mentorSpinner    = findViewById(R.id.mentor_spinner);
        registerButton   = findViewById(R.id.register_button);
        registerProgress = findViewById(R.id.register_progress);

        setupTermsText();
        loadMentors();
        registerButton.setOnClickListener(v -> doRegister());

        TextView loginLink = findViewById(R.id.tv_login);
        if (loginLink != null) loginLink.setOnClickListener(v -> {
            startActivity(new Intent(this, login.class));
            finish();
        });
    }

    private void setupTermsText() {
        TextView tv = findViewById(R.id.tv_terms);
        SpannableString s = new SpannableString("I agree to the Terms of Service and Privacy Policy.");
        ClickableSpan tos = new ClickableSpan() {
            @Override public void onClick(@NonNull View widget) {
                Toast.makeText(register.this, "Terms of Service", Toast.LENGTH_SHORT).show();
            }
        };
        ClickableSpan privacy = new ClickableSpan() {
            @Override public void onClick(@NonNull View widget) {
                Toast.makeText(register.this, "Privacy Policy", Toast.LENGTH_SHORT).show();
            }
        };
        int tosStart = s.toString().indexOf("Terms of Service");
        int tosEnd   = tosStart + "Terms of Service".length();
        int privStart = s.toString().indexOf("Privacy Policy");
        int privEnd   = privStart + "Privacy Policy".length();
        s.setSpan(tos,     tosStart,  tosEnd,  Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        s.setSpan(privacy, privStart, privEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        int blue = ContextCompat.getColor(this, R.color.cal_primary_blue);
        s.setSpan(new ForegroundColorSpan(blue), tosStart,  tosEnd,  Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        s.setSpan(new ForegroundColorSpan(blue), privStart, privEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        tv.setText(s);
        tv.setMovementMethod(LinkMovementMethod.getInstance());
    }

    /**
     * Pulls the public mentor list from GET /api/auth/mentors and binds it
     * into the spinner. The spinner is always built with a "(No mentor)"
     * placeholder at index 0 so the user can opt out -- if the network
     * call fails we just leave that placeholder in place and let signup
     * proceed without a mentor assignment.
     */
    private void loadMentors() {
        // Seed with the placeholder immediately so the spinner is usable
        // even before the network call completes.
        List<String> labels = new ArrayList<>();
        labels.add("(No mentor)");
        ArrayAdapter<String> adapter = new ArrayAdapter<>(
                this, android.R.layout.simple_spinner_item, labels);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        mentorSpinner.setAdapter(adapter);

        ApiClient.get().getMentors().enqueue(new Callback<MentorListResponse>() {
            @Override
            public void onResponse(Call<MentorListResponse> call,
                                   Response<MentorListResponse> response) {
                if (!response.isSuccessful() || response.body() == null
                        || response.body().getData() == null) {
                    return;  // keep the (No mentor) placeholder
                }
                mentors.clear();
                mentors.addAll(response.body().getData());

                List<String> next = new ArrayList<>();
                next.add("(No mentor)");
                for (Mentor m : mentors) next.add(m.getName());
                ArrayAdapter<String> a = new ArrayAdapter<>(
                        register.this,
                        android.R.layout.simple_spinner_item, next);
                a.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
                mentorSpinner.setAdapter(a);
            }

            @Override
            public void onFailure(Call<MentorListResponse> call, Throwable t) {
                // Silent: the user can still register without a mentor.
            }
        });
    }

    private void doRegister() {
        String name     = nameField.getText().toString().trim();
        String email    = emailField.getText().toString().trim();
        String password = passwordField.getText().toString().trim();

        if (TextUtils.isEmpty(name)) { nameField.setError("Required"); return; }
        if (TextUtils.isEmpty(email) || !Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            emailField.setError("Enter a valid email"); return;
        }
        if (TextUtils.isEmpty(password) || password.length() < 6) {
            passwordField.setError("At least 6 characters"); return;
        }
        if (!termsCheckbox.isChecked()) {
            Toast.makeText(this, "Please accept the terms to continue", Toast.LENGTH_SHORT).show();
            return;
        }

        // Spinner index 0 is the "(No mentor)" placeholder; subsequent
        // indices map 1:1 onto `mentors`.
        String mentorId = null;
        int pos = mentorSpinner.getSelectedItemPosition();
        if (pos > 0 && pos - 1 < mentors.size()) {
            mentorId = mentors.get(pos - 1).getId();
        }

        setLoading(true);
        ApiClient.get().register(new RegisterRequest(name, email, password, mentorId))
                .enqueue(new Callback<AuthResponse>() {
                    @Override
                    public void onResponse(Call<AuthResponse> call, Response<AuthResponse> response) {
                        setLoading(false);
                        if (response.isSuccessful() && response.body() != null) {
                            AuthResponse body = response.body();
                            sessionManager.save(body.getToken(), body.getName(), body.getEmail());
                            Intent intent = new Intent(register.this, MainActivity.class);
                            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                            startActivity(intent);
                            finish();
                        } else {
                            showServerError(response);
                        }
                    }

                    @Override
                    public void onFailure(Call<AuthResponse> call, Throwable t) {
                        setLoading(false);
                        Toast.makeText(register.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
                    }
                });
    }

    private void showServerError(Response<?> response) {
        String msg = "Registration failed";
        try {
            if (response.errorBody() != null) {
                JSONObject json = new JSONObject(response.errorBody().string());
                msg = json.optString("error", msg);
            }
        } catch (Exception ignored) {}
        Toast.makeText(this, msg, Toast.LENGTH_LONG).show();
    }

    private void setLoading(boolean loading) {
        registerProgress.setVisibility(loading ? View.VISIBLE : View.GONE);
        registerButton.setEnabled(!loading);
    }
}
