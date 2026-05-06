package com.example.studylab.ui;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.example.studylab.R;
import com.example.studylab.api.SessionManager;
import com.example.studylab.login;

public class ProfileFragment extends Fragment {

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater,
                             @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_profile, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        SessionManager session = new SessionManager(requireContext());

        TextView tvEmail   = view.findViewById(R.id.tv_email);
        TextView tvInitial = view.findViewById(R.id.tv_initial);

        String email = session.getEmail();
        tvEmail.setText(email.isEmpty() ? "Signed in" : email);
        tvInitial.setText(email.isEmpty() ? "?" : String.valueOf(Character.toUpperCase(email.charAt(0))));

        view.findViewById(R.id.btn_sign_out).setOnClickListener(v -> {
            session.logout();
            Intent intent = new Intent(requireActivity(), login.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
            requireActivity().finish();
        });
    }
}
