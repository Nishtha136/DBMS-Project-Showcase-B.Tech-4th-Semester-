namespace GameManagementSystem
{
    partial class DeveloperDashBoard
    {
        private System.ComponentModel.IContainer components = null;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
                components.Dispose();
            base.Dispose(disposing);
        }

        private void InitializeComponent()
        {
            labelWelcome = new Label();
            labelEmail = new Label();
            labelStudio = new Label();
            labelTotalGames = new Label();
            labelSales = new Label();
            labelRevenue = new Label();
            labelMatches = new Label();
            dataGridGames = new DataGridView();
            dataGridMatches = new DataGridView();
            panelManageGames = new Panel();
            labelManageGames = new Label();
            textBoxGameName = new TextBox();
            textBoxGamePrice = new TextBox();
            textBoxGameCategory = new TextBox();
            buttonAddGame = new Button();
            buttonDeleteGame = new Button();
            panelSocial = new Panel();
            labelSocial = new Label();
            textBoxFriend = new TextBox();
            buttonAddFriend = new Button();
            label12 = new Label();
            dataGridFriends = new DataGridView();
            label13 = new Label();
            dataGridRequests = new DataGridView();
            buttonAccept = new Button();
            buttonReject = new Button();
            buttonRefreshSocial = new Button();
            btnLogout = new Button();
            dataGridView1 = new DataGridView();
            panel1 = new Panel();
            label1 = new Label();
            panelMyGames = new Panel();
            label2 = new Label();
            buttonRefreshPurchased = new Button();
            labelMyGames = new Label();
            labelMyGamesSub = new Label();
            labelMatchHistory = new Label();
            panelMatchHistory = new Panel();
            button1 = new Button();
            labelMatchHistoryTitle = new Label();
            dataGridView2 = new DataGridView();
            ((System.ComponentModel.ISupportInitialize)dataGridGames).BeginInit();
            ((System.ComponentModel.ISupportInitialize)dataGridMatches).BeginInit();
            panelManageGames.SuspendLayout();
            panelSocial.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)dataGridFriends).BeginInit();
            ((System.ComponentModel.ISupportInitialize)dataGridRequests).BeginInit();
            ((System.ComponentModel.ISupportInitialize)dataGridView1).BeginInit();
            panel1.SuspendLayout();
            panelMyGames.SuspendLayout();
            panelMatchHistory.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)dataGridView2).BeginInit();
            SuspendLayout();
            // 
            // labelWelcome
            // 
            labelWelcome.AutoSize = true;
            labelWelcome.Font = new Font("Segoe UI Black", 17F, FontStyle.Bold);
            labelWelcome.ForeColor = Color.White;
            labelWelcome.Location = new Point(14, 14);
            labelWelcome.Name = "labelWelcome";
            labelWelcome.Size = new Size(0, 46);
            labelWelcome.TabIndex = 0;
            // 
            // labelEmail
            // 
            labelEmail.AutoSize = true;
            labelEmail.Font = new Font("Segoe UI", 11F, FontStyle.Bold);
            labelEmail.ForeColor = Color.White;
            labelEmail.Location = new Point(14, 65);
            labelEmail.Name = "labelEmail";
            labelEmail.Size = new Size(0, 30);
            labelEmail.TabIndex = 1;
            // 
            // labelStudio
            // 
            labelStudio.AutoSize = true;
            labelStudio.Font = new Font("Segoe UI", 11F, FontStyle.Bold);
            labelStudio.ForeColor = Color.White;
            labelStudio.Location = new Point(14, 100);
            labelStudio.Name = "labelStudio";
            labelStudio.Size = new Size(0, 30);
            labelStudio.TabIndex = 2;
            // 
            // labelTotalGames
            // 
            labelTotalGames.AutoSize = true;
            labelTotalGames.Font = new Font("Segoe UI", 12F, FontStyle.Bold);
            labelTotalGames.ForeColor = Color.White;
            labelTotalGames.Location = new Point(600, 14);
            labelTotalGames.Name = "labelTotalGames";
            labelTotalGames.Size = new Size(0, 32);
            labelTotalGames.TabIndex = 3;
            // 
            // labelSales
            // 
            labelSales.AutoSize = true;
            labelSales.Font = new Font("Segoe UI", 12F, FontStyle.Bold);
            labelSales.ForeColor = Color.White;
            labelSales.Location = new Point(600, 55);
            labelSales.Name = "labelSales";
            labelSales.Size = new Size(0, 32);
            labelSales.TabIndex = 4;
            // 
            // labelRevenue
            // 
            labelRevenue.AutoSize = true;
            labelRevenue.Font = new Font("Segoe UI", 12F, FontStyle.Bold);
            labelRevenue.ForeColor = Color.White;
            labelRevenue.Location = new Point(900, 14);
            labelRevenue.Name = "labelRevenue";
            labelRevenue.Size = new Size(0, 32);
            labelRevenue.TabIndex = 5;
            // 
            // labelMatches
            // 
            labelMatches.AutoSize = true;
            labelMatches.Font = new Font("Segoe UI", 12F, FontStyle.Bold);
            labelMatches.ForeColor = Color.White;
            labelMatches.Location = new Point(900, 55);
            labelMatches.Name = "labelMatches";
            labelMatches.Size = new Size(0, 32);
            labelMatches.TabIndex = 6;
            // 
            // dataGridGames
            // 
            dataGridGames.BackgroundColor = Color.DarkOliveGreen;
            dataGridGames.BorderStyle = BorderStyle.None;
            dataGridGames.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            dataGridGames.GridColor = Color.DarkOliveGreen;
            dataGridGames.Location = new Point(14, 95);
            dataGridGames.Name = "dataGridGames";
            dataGridGames.RowHeadersWidth = 62;
            dataGridGames.Size = new Size(714, 374);
            dataGridGames.TabIndex = 2;
            // 
            // dataGridMatches
            // 
            dataGridMatches.BackgroundColor = Color.DarkOliveGreen;
            dataGridMatches.BorderStyle = BorderStyle.None;
            dataGridMatches.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            dataGridMatches.GridColor = Color.DarkOliveGreen;
            dataGridMatches.Location = new Point(17, 65);
            dataGridMatches.Name = "dataGridMatches";
            dataGridMatches.RowHeadersWidth = 62;
            dataGridMatches.Size = new Size(711, 919);
            dataGridMatches.TabIndex = 1;
            // 
            // panelManageGames
            // 
            panelManageGames.BackColor = Color.OliveDrab;
            panelManageGames.Controls.Add(labelManageGames);
            panelManageGames.Controls.Add(textBoxGameName);
            panelManageGames.Controls.Add(textBoxGamePrice);
            panelManageGames.Controls.Add(textBoxGameCategory);
            panelManageGames.Controls.Add(buttonAddGame);
            panelManageGames.Controls.Add(buttonDeleteGame);
            panelManageGames.Location = new Point(791, 278);
            panelManageGames.Name = "panelManageGames";
            panelManageGames.Size = new Size(664, 205);
            panelManageGames.TabIndex = 2;
            // 
            // labelManageGames
            // 
            labelManageGames.AutoSize = true;
            labelManageGames.Font = new Font("Segoe UI Black", 18F, FontStyle.Bold);
            labelManageGames.ForeColor = Color.White;
            labelManageGames.Location = new Point(0, 0);
            labelManageGames.Name = "labelManageGames";
            labelManageGames.Size = new Size(289, 48);
            labelManageGames.TabIndex = 0;
            labelManageGames.Text = "Manage Games";
            // 
            // textBoxGameName
            // 
            textBoxGameName.BackColor = Color.DarkOliveGreen;
            textBoxGameName.BorderStyle = BorderStyle.None;
            textBoxGameName.Font = new Font("Segoe UI", 12F, FontStyle.Bold);
            textBoxGameName.Location = new Point(18, 70);
            textBoxGameName.Name = "textBoxGameName";
            textBoxGameName.PlaceholderText = "Game Name";
            textBoxGameName.Size = new Size(200, 32);
            textBoxGameName.TabIndex = 1;
            // 
            // textBoxGamePrice
            // 
            textBoxGamePrice.BackColor = Color.DarkOliveGreen;
            textBoxGamePrice.BorderStyle = BorderStyle.None;
            textBoxGamePrice.Font = new Font("Segoe UI", 12F, FontStyle.Bold);
            textBoxGamePrice.Location = new Point(240, 70);
            textBoxGamePrice.Name = "textBoxGamePrice";
            textBoxGamePrice.PlaceholderText = "Price";
            textBoxGamePrice.Size = new Size(150, 32);
            textBoxGamePrice.TabIndex = 2;
            // 
            // textBoxGameCategory
            // 
            textBoxGameCategory.BackColor = Color.DarkOliveGreen;
            textBoxGameCategory.BorderStyle = BorderStyle.None;
            textBoxGameCategory.Font = new Font("Segoe UI", 12F, FontStyle.Bold);
            textBoxGameCategory.Location = new Point(410, 70);
            textBoxGameCategory.Name = "textBoxGameCategory";
            textBoxGameCategory.PlaceholderText = "Category";
            textBoxGameCategory.Size = new Size(150, 32);
            textBoxGameCategory.TabIndex = 3;
            // 
            // buttonAddGame
            // 
            buttonAddGame.BackColor = Color.DarkOliveGreen;
            buttonAddGame.FlatAppearance.BorderSize = 0;
            buttonAddGame.FlatStyle = FlatStyle.Flat;
            buttonAddGame.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            buttonAddGame.ForeColor = Color.White;
            buttonAddGame.Location = new Point(18, 130);
            buttonAddGame.Name = "buttonAddGame";
            buttonAddGame.Size = new Size(160, 40);
            buttonAddGame.TabIndex = 4;
            buttonAddGame.Text = "Add Game";
            buttonAddGame.UseVisualStyleBackColor = false;
            buttonAddGame.Click += buttonAddGame_Click;
            // 
            // buttonDeleteGame
            // 
            buttonDeleteGame.BackColor = Color.Firebrick;
            buttonDeleteGame.FlatAppearance.BorderSize = 0;
            buttonDeleteGame.FlatStyle = FlatStyle.Flat;
            buttonDeleteGame.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            buttonDeleteGame.ForeColor = Color.White;
            buttonDeleteGame.Location = new Point(200, 130);
            buttonDeleteGame.Name = "buttonDeleteGame";
            buttonDeleteGame.Size = new Size(160, 40);
            buttonDeleteGame.TabIndex = 5;
            buttonDeleteGame.Text = "Delete Game";
            buttonDeleteGame.UseVisualStyleBackColor = false;
            buttonDeleteGame.Click += buttonDeleteGame_Click;
            // 
            // panelSocial
            // 
            panelSocial.BackColor = Color.OliveDrab;
            panelSocial.Controls.Add(labelSocial);
            panelSocial.Controls.Add(textBoxFriend);
            panelSocial.Controls.Add(buttonAddFriend);
            panelSocial.Controls.Add(label12);
            panelSocial.Controls.Add(dataGridFriends);
            panelSocial.Controls.Add(label13);
            panelSocial.Controls.Add(dataGridRequests);
            panelSocial.Controls.Add(buttonAccept);
            panelSocial.Controls.Add(buttonReject);
            panelSocial.Controls.Add(buttonRefreshSocial);
            panelSocial.Location = new Point(791, 505);
            panelSocial.Name = "panelSocial";
            panelSocial.Size = new Size(664, 825);
            panelSocial.TabIndex = 0;
            // 
            // labelSocial
            // 
            labelSocial.AutoSize = true;
            labelSocial.Font = new Font("Segoe UI Black", 18F, FontStyle.Bold);
            labelSocial.ForeColor = Color.White;
            labelSocial.Location = new Point(0, 0);
            labelSocial.Name = "labelSocial";
            labelSocial.Size = new Size(124, 48);
            labelSocial.TabIndex = 0;
            labelSocial.Text = "Social";
            // 
            // textBoxFriend
            // 
            textBoxFriend.BackColor = Color.DarkOliveGreen;
            textBoxFriend.BorderStyle = BorderStyle.None;
            textBoxFriend.Font = new Font("Segoe UI", 12F, FontStyle.Bold);
            textBoxFriend.Location = new Point(18, 51);
            textBoxFriend.Name = "textBoxFriend";
            textBoxFriend.PlaceholderText = "Enter UserID";
            textBoxFriend.Size = new Size(187, 32);
            textBoxFriend.TabIndex = 1;
            // 
            // buttonAddFriend
            // 
            buttonAddFriend.BackColor = Color.DarkOliveGreen;
            buttonAddFriend.FlatAppearance.BorderSize = 0;
            buttonAddFriend.FlatStyle = FlatStyle.Flat;
            buttonAddFriend.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            buttonAddFriend.ForeColor = Color.White;
            buttonAddFriend.Location = new Point(220, 49);
            buttonAddFriend.Name = "buttonAddFriend";
            buttonAddFriend.Size = new Size(79, 38);
            buttonAddFriend.TabIndex = 2;
            buttonAddFriend.Text = "Add";
            buttonAddFriend.UseVisualStyleBackColor = false;
            buttonAddFriend.Click += buttonAddFriend_Click;
            // 
            // label12
            // 
            label12.AutoSize = true;
            label12.Font = new Font("Segoe UI", 13F, FontStyle.Bold);
            label12.Location = new Point(18, 98);
            label12.Name = "label12";
            label12.Size = new Size(149, 36);
            label12.TabIndex = 3;
            label12.Text = "My Friends";
            // 
            // dataGridFriends
            // 
            dataGridFriends.BackgroundColor = Color.DarkOliveGreen;
            dataGridFriends.BorderStyle = BorderStyle.None;
            dataGridFriends.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            dataGridFriends.Location = new Point(18, 137);
            dataGridFriends.Name = "dataGridFriends";
            dataGridFriends.RowHeadersWidth = 62;
            dataGridFriends.Size = new Size(629, 264);
            dataGridFriends.TabIndex = 4;
            // 
            // label13
            // 
            label13.AutoSize = true;
            label13.Font = new Font("Segoe UI", 13F, FontStyle.Bold);
            label13.Location = new Point(18, 420);
            label13.Name = "label13";
            label13.Size = new Size(245, 36);
            label13.TabIndex = 5;
            label13.Text = "Incoming Requests";
            // 
            // dataGridRequests
            // 
            dataGridRequests.BackgroundColor = Color.DarkOliveGreen;
            dataGridRequests.BorderStyle = BorderStyle.None;
            dataGridRequests.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            dataGridRequests.Location = new Point(18, 459);
            dataGridRequests.Name = "dataGridRequests";
            dataGridRequests.RowHeadersWidth = 62;
            dataGridRequests.Size = new Size(629, 281);
            dataGridRequests.TabIndex = 6;
            // 
            // buttonAccept
            // 
            buttonAccept.BackColor = Color.ForestGreen;
            buttonAccept.FlatAppearance.BorderSize = 0;
            buttonAccept.FlatStyle = FlatStyle.Flat;
            buttonAccept.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            buttonAccept.ForeColor = Color.White;
            buttonAccept.Location = new Point(46, 756);
            buttonAccept.Name = "buttonAccept";
            buttonAccept.Size = new Size(112, 52);
            buttonAccept.TabIndex = 7;
            buttonAccept.Text = "Accept";
            buttonAccept.UseVisualStyleBackColor = false;
            buttonAccept.Click += buttonAccept_Click;
            // 
            // buttonReject
            // 
            buttonReject.BackColor = Color.Firebrick;
            buttonReject.FlatAppearance.BorderSize = 0;
            buttonReject.FlatStyle = FlatStyle.Flat;
            buttonReject.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            buttonReject.ForeColor = Color.White;
            buttonReject.Location = new Point(177, 756);
            buttonReject.Name = "buttonReject";
            buttonReject.Size = new Size(112, 52);
            buttonReject.TabIndex = 8;
            buttonReject.Text = "Reject";
            buttonReject.UseVisualStyleBackColor = false;
            buttonReject.Click += buttonReject_Click;
            // 
            // buttonRefreshSocial
            // 
            buttonRefreshSocial.BackColor = Color.DarkOliveGreen;
            buttonRefreshSocial.FlatAppearance.BorderSize = 0;
            buttonRefreshSocial.FlatStyle = FlatStyle.Flat;
            buttonRefreshSocial.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            buttonRefreshSocial.ForeColor = Color.White;
            buttonRefreshSocial.Location = new Point(535, 756);
            buttonRefreshSocial.Name = "buttonRefreshSocial";
            buttonRefreshSocial.Size = new Size(112, 34);
            buttonRefreshSocial.TabIndex = 9;
            buttonRefreshSocial.Text = "Refresh";
            buttonRefreshSocial.UseVisualStyleBackColor = false;
            buttonRefreshSocial.Click += buttonRefreshSocial_Click;
            // 
            // btnLogout
            // 
            btnLogout.BackColor = Color.DarkOliveGreen;
            btnLogout.FlatAppearance.BorderSize = 0;
            btnLogout.FlatStyle = FlatStyle.Flat;
            btnLogout.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            btnLogout.ForeColor = Color.White;
            btnLogout.Location = new Point(1925, 90);
            btnLogout.Name = "btnLogout";
            btnLogout.Size = new Size(120, 40);
            btnLogout.TabIndex = 7;
            btnLogout.Text = "Logout";
            btnLogout.UseVisualStyleBackColor = false;
            btnLogout.Click += btnLogout_Click;
            // 
            // dataGridView1
            // 
            dataGridView1.BackgroundColor = Color.DarkOliveGreen;
            dataGridView1.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            dataGridView1.GridColor = Color.DarkOliveGreen;
            dataGridView1.Location = new Point(2, -4);
            dataGridView1.Name = "dataGridView1";
            dataGridView1.RowHeadersWidth = 62;
            dataGridView1.Size = new Size(2245, 1372);
            dataGridView1.TabIndex = 0;
            // 
            // panel1
            // 
            panel1.BackColor = Color.OliveDrab;
            panel1.Controls.Add(labelWelcome);
            panel1.Controls.Add(labelEmail);
            panel1.Controls.Add(labelStudio);
            panel1.Controls.Add(labelTotalGames);
            panel1.Controls.Add(labelSales);
            panel1.Controls.Add(labelRevenue);
            panel1.Controls.Add(labelMatches);
            panel1.Controls.Add(btnLogout);
            panel1.Location = new Point(12, 120);
            panel1.Name = "panel1";
            panel1.Size = new Size(2220, 142);
            panel1.TabIndex = 5;
            // 
            // label1
            // 
            label1.AutoSize = true;
            label1.BackColor = Color.DarkOliveGreen;
            label1.Font = new Font("Segoe UI Black", 28F, FontStyle.Bold);
            label1.ForeColor = Color.DarkSeaGreen;
            label1.Location = new Point(12, 18);
            label1.Name = "label1";
            label1.Size = new Size(372, 74);
            label1.TabIndex = 4;
            label1.Text = "GAMEVERSE";
            // 
            // panelMyGames
            // 
            panelMyGames.BackColor = Color.OliveDrab;
            panelMyGames.Controls.Add(dataGridView2);
            panelMyGames.Controls.Add(label2);
            panelMyGames.Controls.Add(buttonRefreshPurchased);
            panelMyGames.Controls.Add(labelMyGames);
            panelMyGames.Controls.Add(labelMyGamesSub);
            panelMyGames.Controls.Add(dataGridGames);
            panelMyGames.Location = new Point(26, 278);
            panelMyGames.Name = "panelMyGames";
            panelMyGames.Size = new Size(744, 1052);
            panelMyGames.TabIndex = 3;
            // 
            // label2
            // 
            label2.AutoSize = true;
            label2.Font = new Font("Segoe UI", 13F, FontStyle.Bold);
            label2.Location = new Point(14, 499);
            label2.Name = "label2";
            label2.Size = new Size(97, 36);
            label2.TabIndex = 12;
            label2.Text = "Buyers";
            // 
            // buttonRefreshPurchased
            // 
            buttonRefreshPurchased.BackColor = Color.DarkOliveGreen;
            buttonRefreshPurchased.FlatAppearance.BorderSize = 0;
            buttonRefreshPurchased.FlatStyle = FlatStyle.Flat;
            buttonRefreshPurchased.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            buttonRefreshPurchased.ForeColor = Color.White;
            buttonRefreshPurchased.Location = new Point(616, 1001);
            buttonRefreshPurchased.Name = "buttonRefreshPurchased";
            buttonRefreshPurchased.Size = new Size(112, 34);
            buttonRefreshPurchased.TabIndex = 11;
            buttonRefreshPurchased.Text = "Refresh";
            buttonRefreshPurchased.UseVisualStyleBackColor = false;
            buttonRefreshPurchased.Click += buttonRefreshPurchased_Click;
            // 
            // labelMyGames
            // 
            labelMyGames.AutoSize = true;
            labelMyGames.Font = new Font("Segoe UI Black", 18F, FontStyle.Bold);
            labelMyGames.ForeColor = Color.White;
            labelMyGames.Location = new Point(0, 0);
            labelMyGames.Name = "labelMyGames";
            labelMyGames.Size = new Size(204, 48);
            labelMyGames.TabIndex = 0;
            labelMyGames.Text = "My Games";
            // 
            // labelMyGamesSub
            // 
            labelMyGamesSub.AutoSize = true;
            labelMyGamesSub.Font = new Font("Segoe UI", 13F, FontStyle.Bold);
            labelMyGamesSub.Location = new Point(14, 48);
            labelMyGamesSub.Name = "labelMyGamesSub";
            labelMyGamesSub.Size = new Size(222, 36);
            labelMyGamesSub.TabIndex = 1;
            labelMyGamesSub.Text = "Published Games";
            // 
            // labelMatchHistory
            // 
            labelMatchHistory.Location = new Point(0, 0);
            labelMatchHistory.Name = "labelMatchHistory";
            labelMatchHistory.Size = new Size(100, 23);
            labelMatchHistory.TabIndex = 0;
            // 
            // panelMatchHistory
            // 
            panelMatchHistory.BackColor = Color.OliveDrab;
            panelMatchHistory.Controls.Add(button1);
            panelMatchHistory.Controls.Add(labelMatchHistoryTitle);
            panelMatchHistory.Controls.Add(dataGridMatches);
            panelMatchHistory.Location = new Point(1473, 278);
            panelMatchHistory.Name = "panelMatchHistory";
            panelMatchHistory.Size = new Size(744, 1052);
            panelMatchHistory.TabIndex = 1;
            // 
            // button1
            // 
            button1.BackColor = Color.DarkOliveGreen;
            button1.FlatAppearance.BorderSize = 0;
            button1.FlatStyle = FlatStyle.Flat;
            button1.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            button1.ForeColor = Color.White;
            button1.Location = new Point(616, 1001);
            button1.Name = "button1";
            button1.Size = new Size(112, 34);
            button1.TabIndex = 11;
            button1.Text = "Refresh";
            button1.UseVisualStyleBackColor = false;
            // 
            // labelMatchHistoryTitle
            // 
            labelMatchHistoryTitle.AutoSize = true;
            labelMatchHistoryTitle.Font = new Font("Segoe UI Black", 18F, FontStyle.Bold);
            labelMatchHistoryTitle.ForeColor = Color.White;
            labelMatchHistoryTitle.Location = new Point(0, 0);
            labelMatchHistoryTitle.Name = "labelMatchHistoryTitle";
            labelMatchHistoryTitle.Size = new Size(273, 48);
            labelMatchHistoryTitle.TabIndex = 0;
            labelMatchHistoryTitle.Text = "Match History";
            // 
            // dataGridView2
            // 
            dataGridView2.BackgroundColor = Color.DarkOliveGreen;
            dataGridView2.BorderStyle = BorderStyle.None;
            dataGridView2.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            dataGridView2.GridColor = Color.DarkOliveGreen;
            dataGridView2.Location = new Point(14, 547);
            dataGridView2.Name = "dataGridView2";
            dataGridView2.RowHeadersWidth = 62;
            dataGridView2.Size = new Size(714, 437);
            dataGridView2.TabIndex = 13;
            // 
            // DeveloperDashBoard
            // 
            AutoScaleDimensions = new SizeF(10F, 25F);
            AutoScaleMode = AutoScaleMode.Font;
            AutoScroll = true;
            BackColor = Color.DarkOliveGreen;
            ClientSize = new Size(2244, 1370);
            Controls.Add(panelSocial);
            Controls.Add(panelMatchHistory);
            Controls.Add(panelManageGames);
            Controls.Add(panelMyGames);
            Controls.Add(label1);
            Controls.Add(panel1);
            Controls.Add(dataGridView1);
            Name = "DeveloperDashBoard";
            Text = "Developer Dashboard";
            Load += DeveloperDashBoard_Load;
            ((System.ComponentModel.ISupportInitialize)dataGridGames).EndInit();
            ((System.ComponentModel.ISupportInitialize)dataGridMatches).EndInit();
            panelManageGames.ResumeLayout(false);
            panelManageGames.PerformLayout();
            panelSocial.ResumeLayout(false);
            panelSocial.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)dataGridFriends).EndInit();
            ((System.ComponentModel.ISupportInitialize)dataGridRequests).EndInit();
            ((System.ComponentModel.ISupportInitialize)dataGridView1).EndInit();
            panel1.ResumeLayout(false);
            panel1.PerformLayout();
            panelMyGames.ResumeLayout(false);
            panelMyGames.PerformLayout();
            panelMatchHistory.ResumeLayout(false);
            panelMatchHistory.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)dataGridView2).EndInit();
            ResumeLayout(false);
            PerformLayout();
        }

        private System.Windows.Forms.DataGridView dataGridView1;
        private System.Windows.Forms.Panel panel1;
        private System.Windows.Forms.Label label1;

        private System.Windows.Forms.Label labelWelcome;
        private System.Windows.Forms.Label labelEmail;
        private System.Windows.Forms.Label labelStudio;

        private System.Windows.Forms.Label labelTotalGames;
        private System.Windows.Forms.Label labelSales;
        private System.Windows.Forms.Label labelRevenue;
        private System.Windows.Forms.Label labelMatches;

        private System.Windows.Forms.Panel panelMyGames;
        private System.Windows.Forms.Label labelMyGames;
        private System.Windows.Forms.Label labelMyGamesSub;
        private System.Windows.Forms.DataGridView dataGridGames;

        private System.Windows.Forms.Panel panelMatchHistory;
        private System.Windows.Forms.Label labelMatchHistoryTitle;
        private System.Windows.Forms.DataGridView dataGridMatches;

        private System.Windows.Forms.Panel panelManageGames;
        private System.Windows.Forms.Label labelManageGames;
        private System.Windows.Forms.TextBox textBoxGameName;
        private System.Windows.Forms.TextBox textBoxGamePrice;
        private System.Windows.Forms.TextBox textBoxGameCategory;
        private System.Windows.Forms.Button buttonAddGame;
        private System.Windows.Forms.Button buttonDeleteGame;

        private System.Windows.Forms.Panel panelSocial;
        private System.Windows.Forms.Label labelSocial;
        private System.Windows.Forms.Label label12;
        private System.Windows.Forms.Label label13;
        private System.Windows.Forms.TextBox textBoxFriend;
        private System.Windows.Forms.Button buttonAddFriend;
        private System.Windows.Forms.Button buttonAccept;
        private System.Windows.Forms.Button buttonReject;
        private System.Windows.Forms.Button buttonRefreshSocial;
        private System.Windows.Forms.DataGridView dataGridRequests;
        private System.Windows.Forms.DataGridView dataGridFriends;

        private System.Windows.Forms.Button btnLogout;
        private System.Windows.Forms.Label labelMatchHistory;
        private Button buttonRefreshPurchased;
        private Button button1;
        private Label label2;
        private DataGridView dataGridView2;
    }
}
