namespace GameManagementSystem
{
    partial class AdminDashBoard
    {
        private System.ComponentModel.IContainer components = null;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        private void InitializeComponent()
        {
            dgvBackground = new DataGridView();
            panelHeader = new Panel();
            btnLogout = new Button();
            labelBalance = new Label();
            labelEmail = new Label();
            labelWelcome = new Label();
            labelLogo = new Label();
            panelPendingRequests = new Panel();
            btnRefreshPending = new Button();
            btnRejectGame = new Button();
            btnApproveGame = new Button();
            dgvPendingGames = new DataGridView();
            labelPendingRequests = new Label();
            panelGameApprovals = new Panel();
            btnRefreshApprovals = new Button();
            dgvGameHistory = new DataGridView();
            labelGameApprovals = new Label();
            panelWallet = new Panel();
            btnRefreshWallet = new Button();
            dgvAdminTransactions = new DataGridView();
            labelWallet = new Label();
            ((System.ComponentModel.ISupportInitialize)dgvBackground).BeginInit();
            panelHeader.SuspendLayout();
            panelPendingRequests.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)dgvPendingGames).BeginInit();
            panelGameApprovals.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)dgvGameHistory).BeginInit();
            panelWallet.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)dgvAdminTransactions).BeginInit();
            SuspendLayout();
            // 
            // dgvBackground
            // 
            dgvBackground.BackgroundColor = Color.DarkOliveGreen;
            dgvBackground.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            dgvBackground.Dock = DockStyle.Fill;
            dgvBackground.GridColor = Color.DarkOliveGreen;
            dgvBackground.Location = new Point(0, 0);
            dgvBackground.Name = "dgvBackground";
            dgvBackground.RowHeadersWidth = 62;
            dgvBackground.Size = new Size(2244, 1370);
            dgvBackground.TabIndex = 0;
            // 
            // panelHeader
            // 
            panelHeader.BackColor = Color.OliveDrab;
            panelHeader.Controls.Add(btnLogout);
            panelHeader.Controls.Add(labelBalance);
            panelHeader.Controls.Add(labelEmail);
            panelHeader.Controls.Add(labelWelcome);
            panelHeader.Location = new Point(12, 120);
            panelHeader.Name = "panelHeader";
            panelHeader.Size = new Size(2220, 142);
            panelHeader.TabIndex = 2;
            // 
            // btnLogout
            // 
            btnLogout.BackColor = Color.DarkOliveGreen;
            btnLogout.FlatAppearance.BorderSize = 0;
            btnLogout.FlatStyle = FlatStyle.Flat;
            btnLogout.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            btnLogout.ForeColor = Color.White;
            btnLogout.Location = new Point(1976, 80);
            btnLogout.Name = "btnLogout";
            btnLogout.Size = new Size(120, 40);
            btnLogout.TabIndex = 4;
            btnLogout.Text = "Logout";
            btnLogout.UseVisualStyleBackColor = false;
            btnLogout.Click += btnLogout_Click;
            // 
            // labelBalance
            // 
            labelBalance.AutoSize = true;
            labelBalance.Font = new Font("Segoe UI", 14F, FontStyle.Bold);
            labelBalance.ForeColor = Color.White;
            labelBalance.Location = new Point(1461, 14);
            labelBalance.Name = "labelBalance";
            labelBalance.Size = new Size(176, 38);
            labelBalance.TabIndex = 3;
            labelBalance.Text = "Revenue: ₹0";
            // 
            // labelEmail
            // 
            labelEmail.AutoSize = true;
            labelEmail.Font = new Font("Segoe UI", 11F, FontStyle.Bold);
            labelEmail.ForeColor = Color.White;
            labelEmail.Location = new Point(14, 80);
            labelEmail.Name = "labelEmail";
            labelEmail.Size = new Size(108, 30);
            labelEmail.TabIndex = 2;
            labelEmail.Text = "Email: ---";
            // 
            // labelWelcome
            // 
            labelWelcome.AutoSize = true;
            labelWelcome.Font = new Font("Segoe UI Black", 17F, FontStyle.Bold);
            labelWelcome.ForeColor = Color.White;
            labelWelcome.Location = new Point(14, 14);
            labelWelcome.Name = "labelWelcome";
            labelWelcome.Size = new Size(318, 46);
            labelWelcome.TabIndex = 1;
            labelWelcome.Text = "Welcome, Admin!";
            // 
            // labelLogo
            // 
            labelLogo.AutoSize = true;
            labelLogo.BackColor = Color.DarkOliveGreen;
            labelLogo.Font = new Font("Segoe UI Black", 28F, FontStyle.Bold);
            labelLogo.ForeColor = Color.DarkSeaGreen;
            labelLogo.Location = new Point(12, 18);
            labelLogo.Name = "labelLogo";
            labelLogo.Size = new Size(372, 74);
            labelLogo.TabIndex = 0;
            labelLogo.Text = "GAMEVERSE";
            // 
            // panelPendingRequests
            // 
            panelPendingRequests.BackColor = Color.OliveDrab;
            panelPendingRequests.Controls.Add(btnRefreshPending);
            panelPendingRequests.Controls.Add(btnRejectGame);
            panelPendingRequests.Controls.Add(btnApproveGame);
            panelPendingRequests.Controls.Add(dgvPendingGames);
            panelPendingRequests.Controls.Add(labelPendingRequests);
            panelPendingRequests.Location = new Point(26, 278);
            panelPendingRequests.Name = "panelPendingRequests";
            panelPendingRequests.Size = new Size(744, 1061);
            panelPendingRequests.TabIndex = 4;
            // 
            // btnRefreshPending
            // 
            btnRefreshPending.BackColor = Color.DarkOliveGreen;
            btnRefreshPending.FlatAppearance.BorderSize = 0;
            btnRefreshPending.FlatStyle = FlatStyle.Flat;
            btnRefreshPending.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            btnRefreshPending.ForeColor = Color.White;
            btnRefreshPending.Location = new Point(616, 992);
            btnRefreshPending.Name = "btnRefreshPending";
            btnRefreshPending.Size = new Size(112, 34);
            btnRefreshPending.TabIndex = 10;
            btnRefreshPending.Text = "Refresh";
            btnRefreshPending.UseVisualStyleBackColor = false;
            btnRefreshPending.Click += btnRefreshPending_Click;
            // 
            // btnRejectGame
            // 
            btnRejectGame.BackColor = Color.Firebrick;
            btnRejectGame.FlatAppearance.BorderSize = 0;
            btnRejectGame.FlatStyle = FlatStyle.Flat;
            btnRejectGame.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            btnRejectGame.ForeColor = Color.White;
            btnRejectGame.Location = new Point(178, 992);
            btnRejectGame.Name = "btnRejectGame";
            btnRejectGame.Size = new Size(140, 45);
            btnRejectGame.TabIndex = 3;
            btnRejectGame.Text = "Reject";
            btnRejectGame.UseVisualStyleBackColor = false;
            btnRejectGame.Click += btnRejectGame_Click;
            // 
            // btnApproveGame
            // 
            btnApproveGame.BackColor = Color.ForestGreen;
            btnApproveGame.FlatAppearance.BorderSize = 0;
            btnApproveGame.FlatStyle = FlatStyle.Flat;
            btnApproveGame.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            btnApproveGame.ForeColor = Color.White;
            btnApproveGame.Location = new Point(14, 992);
            btnApproveGame.Name = "btnApproveGame";
            btnApproveGame.Size = new Size(140, 45);
            btnApproveGame.TabIndex = 2;
            btnApproveGame.Text = "Approve";
            btnApproveGame.UseVisualStyleBackColor = false;
            btnApproveGame.Click += btnApproveGame_Click;
            // 
            // dgvPendingGames
            // 
            dgvPendingGames.BackgroundColor = Color.DarkOliveGreen;
            dgvPendingGames.BorderStyle = BorderStyle.None;
            dgvPendingGames.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            dgvPendingGames.GridColor = Color.DarkOliveGreen;
            dgvPendingGames.Location = new Point(14, 55);
            dgvPendingGames.Name = "dgvPendingGames";
            dgvPendingGames.RowHeadersWidth = 62;
            dgvPendingGames.Size = new Size(714, 919);
            dgvPendingGames.TabIndex = 1;
            // 
            // labelPendingRequests
            // 
            labelPendingRequests.AutoSize = true;
            labelPendingRequests.Font = new Font("Segoe UI Black", 18F, FontStyle.Bold);
            labelPendingRequests.ForeColor = Color.White;
            labelPendingRequests.Location = new Point(0, 0);
            labelPendingRequests.Name = "labelPendingRequests";
            labelPendingRequests.Size = new Size(337, 48);
            labelPendingRequests.TabIndex = 0;
            labelPendingRequests.Text = "Pending Requests";
            // 
            // panelGameApprovals
            // 
            panelGameApprovals.BackColor = Color.OliveDrab;
            panelGameApprovals.Controls.Add(btnRefreshApprovals);
            panelGameApprovals.Controls.Add(dgvGameHistory);
            panelGameApprovals.Controls.Add(labelGameApprovals);
            panelGameApprovals.Location = new Point(792, 278);
            panelGameApprovals.Name = "panelGameApprovals";
            panelGameApprovals.Size = new Size(664, 1061);
            panelGameApprovals.TabIndex = 5;
            // 
            // btnRefreshApprovals
            // 
            btnRefreshApprovals.BackColor = Color.DarkOliveGreen;
            btnRefreshApprovals.FlatAppearance.BorderSize = 0;
            btnRefreshApprovals.FlatStyle = FlatStyle.Flat;
            btnRefreshApprovals.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            btnRefreshApprovals.ForeColor = Color.White;
            btnRefreshApprovals.Location = new Point(533, 992);
            btnRefreshApprovals.Name = "btnRefreshApprovals";
            btnRefreshApprovals.Size = new Size(112, 34);
            btnRefreshApprovals.TabIndex = 10;
            btnRefreshApprovals.Text = "Refresh";
            btnRefreshApprovals.UseVisualStyleBackColor = false;
            btnRefreshApprovals.Click += btnRefreshApprovals_Click;
            // 
            // dgvGameHistory
            // 
            dgvGameHistory.BackgroundColor = Color.DarkOliveGreen;
            dgvGameHistory.BorderStyle = BorderStyle.None;
            dgvGameHistory.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            dgvGameHistory.GridColor = Color.DarkOliveGreen;
            dgvGameHistory.Location = new Point(14, 55);
            dgvGameHistory.Name = "dgvGameHistory";
            dgvGameHistory.RowHeadersWidth = 62;
            dgvGameHistory.Size = new Size(631, 919);
            dgvGameHistory.TabIndex = 1;
            // 
            // labelGameApprovals
            // 
            labelGameApprovals.AutoSize = true;
            labelGameApprovals.Font = new Font("Segoe UI Black", 18F, FontStyle.Bold);
            labelGameApprovals.ForeColor = Color.White;
            labelGameApprovals.Location = new Point(0, 0);
            labelGameApprovals.Name = "labelGameApprovals";
            labelGameApprovals.Size = new Size(311, 48);
            labelGameApprovals.TabIndex = 0;
            labelGameApprovals.Text = "Game Approvals";
            // 
            // panelWallet
            // 
            panelWallet.BackColor = Color.OliveDrab;
            panelWallet.Controls.Add(btnRefreshWallet);
            panelWallet.Controls.Add(dgvAdminTransactions);
            panelWallet.Controls.Add(labelWallet);
            panelWallet.Location = new Point(1473, 278);
            panelWallet.Name = "panelWallet";
            panelWallet.Size = new Size(744, 1061);
            panelWallet.TabIndex = 6;
            // 
            // btnRefreshWallet
            // 
            btnRefreshWallet.BackColor = Color.DarkOliveGreen;
            btnRefreshWallet.FlatAppearance.BorderSize = 0;
            btnRefreshWallet.FlatStyle = FlatStyle.Flat;
            btnRefreshWallet.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            btnRefreshWallet.ForeColor = Color.White;
            btnRefreshWallet.Location = new Point(616, 992);
            btnRefreshWallet.Name = "btnRefreshWallet";
            btnRefreshWallet.Size = new Size(112, 34);
            btnRefreshWallet.TabIndex = 10;
            btnRefreshWallet.Text = "Refresh";
            btnRefreshWallet.UseVisualStyleBackColor = false;
            btnRefreshWallet.Click += btnRefreshWallet_Click;
            // 
            // dgvAdminTransactions
            // 
            dgvAdminTransactions.BackgroundColor = Color.DarkOliveGreen;
            dgvAdminTransactions.BorderStyle = BorderStyle.None;
            dgvAdminTransactions.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            dgvAdminTransactions.GridColor = Color.DarkOliveGreen;
            dgvAdminTransactions.Location = new Point(14, 55);
            dgvAdminTransactions.Name = "dgvAdminTransactions";
            dgvAdminTransactions.RowHeadersWidth = 62;
            dgvAdminTransactions.Size = new Size(714, 919);
            dgvAdminTransactions.TabIndex = 4;
            // 
            // labelWallet
            // 
            labelWallet.AutoSize = true;
            labelWallet.Font = new Font("Segoe UI Black", 18F, FontStyle.Bold);
            labelWallet.ForeColor = Color.White;
            labelWallet.Location = new Point(0, 0);
            labelWallet.Name = "labelWallet";
            labelWallet.Size = new Size(263, 48);
            labelWallet.TabIndex = 0;
            labelWallet.Text = "Admin Wallet";
            // 
            // AdminDashBoard
            // 
            AutoScaleDimensions = new SizeF(10F, 25F);
            AutoScaleMode = AutoScaleMode.Font;
            AutoScroll = true;
            ClientSize = new Size(2244, 1370);
            Controls.Add(panelWallet);
            Controls.Add(panelGameApprovals);
            Controls.Add(panelPendingRequests);
            Controls.Add(labelLogo);
            Controls.Add(panelHeader);
            Controls.Add(dgvBackground);

            Name = "AdminDashBoard";
            Text = "AdminDashBoard";
            Load += AdminDashBoard_Load;
            ((System.ComponentModel.ISupportInitialize)dgvBackground).EndInit();
            panelHeader.ResumeLayout(false);
            panelHeader.PerformLayout();
            panelPendingRequests.ResumeLayout(false);
            panelPendingRequests.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)dgvPendingGames).EndInit();
            panelGameApprovals.ResumeLayout(false);
            panelGameApprovals.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)dgvGameHistory).EndInit();
            panelWallet.ResumeLayout(false);
            panelWallet.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)dgvAdminTransactions).EndInit();
            ResumeLayout(false);
            PerformLayout();
        }

        #endregion

        private DataGridView dgvBackground;
        private Panel panelHeader;
        private Label labelBalance;
        private Label labelEmail;
        private Label labelWelcome;
        private Label labelLogo;
        private Panel panelPendingRequests;
        private Label labelPendingRequests;
        private DataGridView dgvPendingGames;
        private Button btnRejectGame;
        private Button btnApproveGame;
        private Panel panelGameApprovals;
        private Label labelGameApprovals;
        private DataGridView dgvGameHistory;
        private Panel panelWallet;
        private Label labelWallet;
        private DataGridView dgvAdminTransactions;
        private Button btnLogout;
        private Button btnRefreshPending;
        private Button btnRefreshApprovals;
        private Button btnRefreshWallet;
    }
}