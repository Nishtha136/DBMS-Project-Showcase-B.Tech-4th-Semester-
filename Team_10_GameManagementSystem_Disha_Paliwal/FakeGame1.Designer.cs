namespace GameManagementSystem
{
    partial class FakeGame1
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            components = new System.ComponentModel.Container();
            lblGameTitle = new Label();
            lblTime = new Label();
            lblInfo = new Label();
            btnStart = new Button();
            btnStop = new Button();
            gameTimer = new System.Windows.Forms.Timer(components);
            SuspendLayout();
            // 
            // lblGameTitle
            // 
            lblGameTitle.AutoSize = true;
            lblGameTitle.Font = new Font("Segoe UI", 20F);
            lblGameTitle.Location = new Point(146, 81);
            lblGameTitle.Name = "lblGameTitle";
            lblGameTitle.Size = new Size(274, 54);
            lblGameTitle.TabIndex = 1;
            lblGameTitle.Text = "Survival Mode";
            // 
            // lblTime
            // 
            lblTime.AutoSize = true;
            lblTime.Font = new Font("Segoe UI", 20F);
            lblTime.Location = new Point(155, 201);
            lblTime.Name = "lblTime";
            lblTime.Size = new Size(151, 54);
            lblTime.TabIndex = 2;
            lblTime.Text = "Time: 0";
            // 
            // lblInfo
            // 
            lblInfo.AutoSize = true;
            lblInfo.Font = new Font("Segoe UI", 20F);
            lblInfo.Location = new Point(185, 506);
            lblInfo.Name = "lblInfo";
            lblInfo.Size = new Size(770, 54);
            lblInfo.TabIndex = 3;
            lblInfo.Text = "Stay as long as possible. Your time = score";
            // 
            // btnStart
            // 
            btnStart.BackColor = Color.Green;
            btnStart.FlatAppearance.BorderSize = 0;
            btnStart.FlatStyle = FlatStyle.Flat;
            btnStart.Font = new Font("Segoe UI", 12F, FontStyle.Bold, GraphicsUnit.Point, 0);
            btnStart.Location = new Point(208, 368);
            btnStart.Name = "btnStart";
            btnStart.Size = new Size(179, 69);
            btnStart.TabIndex = 4;
            btnStart.Text = "Start Game";
            btnStart.UseVisualStyleBackColor = false;
            btnStart.Click += btnStart_Click;
            // 
            // btnStop
            // 
            btnStop.BackColor = Color.DarkOrange;
            btnStop.FlatAppearance.BorderSize = 0;
            btnStop.FlatStyle = FlatStyle.Flat;
            btnStop.Font = new Font("Segoe UI", 12F, FontStyle.Bold, GraphicsUnit.Point, 0);
            btnStop.Location = new Point(731, 368);
            btnStop.Name = "btnStop";
            btnStop.Size = new Size(179, 69);
            btnStop.TabIndex = 5;
            btnStop.Text = "End Game";
            btnStop.UseVisualStyleBackColor = false;
            btnStop.Click += btnStop_Click;
            // 
            // gameTimer
            // 
            gameTimer.Interval = 1000;
            gameTimer.Tick += GameTimer_Tick;
            // 
            // FakeGame1
            // 
            AutoScaleDimensions = new SizeF(10F, 25F);
            AutoScaleMode = AutoScaleMode.Font;
            BackColor = Color.DarkOliveGreen;
            ClientSize = new Size(1207, 580);
            Controls.Add(btnStop);
            Controls.Add(btnStart);
            Controls.Add(lblInfo);
            Controls.Add(lblTime);
            Controls.Add(lblGameTitle);
            Name = "FakeGame1";
            Text = "FakeGame1";
            Load += FakeGame1_Load;
            ResumeLayout(false);
            PerformLayout();
        }

        #endregion

        private Label lblGameTitle;
        private Label lblTime;
        private Label lblInfo;
        private Button btnStart;
        private Button btnStop;
        private System.Windows.Forms.Timer gameTimer;
    }
}