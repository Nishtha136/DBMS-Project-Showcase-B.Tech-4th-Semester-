package com.example.studylab;

import android.content.Intent;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.example.studylab.api.ApiClient;
import com.example.studylab.api.AuthResponse;
import com.example.studylab.api.LoginRequest;
import com.example.studylab.api.SessionManager;
import com.google.android.material.button.MaterialButton;
import org.json.JSONObject;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class login extends AppCompatActivity {

    private EditText emailField, passwordField;
    private MaterialButton loginButton;
    private ProgressBar loginProgress;
    private SessionManager sessionManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        sessionManager = new SessionManager(this);

        if (sessionManager.isLoggedIn()) {
            startActivity(new Intent(this, MainActivity.class));
            finish();
            return;
        }

        setContentView(R.layout.login_activity);

        emailField    = findViewById(R.id.email_edittext);
        passwordField = findViewById(R.id.password_edittext);
        loginButton   = findViewById(R.id.login_button);
        loginProgress = findViewById(R.id.login_progress);

        loginButton.setOnClickListener(v -> doLogin());

        TextView signUp = findViewById(R.id.tv_signup);
        if (signUp != null) signUp.setOnClickListener(v ->
                startActivity(new Intent(this, register.class)));

        TextView forgot = findViewById(R.id.tv_forgot_password);
        if (forgot != null) forgot.setOnClickListener(v ->
                Toast.makeText(this, "Password reset coming soon", Toast.LENGTH_SHORT).show());
    }

    private void doLogin() {
        String email    = emailField.getText().toString().trim();
        String password = passwordField.getText().toString().trim();

        if (TextUtils.isEmpty(email))    { emailField.setError("Email required"); return; }
        if (TextUtils.isEmpty(password)) { passwordField.setError("Password required"); return; }

        setLoading(true);
        ApiClient.get().login(new LoginRequest(email, password))
                .enqueue(new Callback<AuthResponse>() {
                    @Override
                    public void onResponse(Call<AuthResponse> call, Response<AuthResponse> response) {
                        setLoading(false);
                        if (response.isSuccessful() && response.body() != null) {
                            AuthResponse body = response.body();
                            sessionManager.save(body.getToken(), body.getName(), body.getEmail());
                            Intent intent = new Intent(login.this, MainActivity.class);
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
                        Toast.makeText(login.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
                    }
                });
    }

    private void showServerError(Response<?> response) {
        String msg = "Login failed";
        try {
            if (response.errorBody() != null) {
                JSONObject json = new JSONObject(response.errorBody().string());
                msg = json.optString("error", msg);
            }
        } catch (Exception ignored) {}
        Toast.makeText(this, msg, Toast.LENGTH_LONG).show();
    }

    private void setLoading(boolean loading) {
        loginProgress.setVisibility(loading ? View.VISIBLE : View.GONE);
        loginButton.setEnabled(!loading);
    }
}
