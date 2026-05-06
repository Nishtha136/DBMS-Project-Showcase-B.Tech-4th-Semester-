namespace GameManagementSystem
{
    partial class FakeGame2
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
            lblGameTitle.Location = new Point(109, 64);
            lblGameTitle.Name = "lblGameTitle";
            lblGameTitle.Size = new Size(324, 54);
            lblGameTitle.TabIndex = 0;
            lblGameTitle.Text = "Endurance Mode";
            // 
            // lblTime
            // 
            lblTime.AutoSize = true;
            lblTime.Font = new Font("Segoe UI", 20F);
            lblTime.Location = new Point(109, 192);
            lblTime.Name = "lblTime";
            lblTime.Size = new Size(151, 54);
            lblTime.TabIndex = 1;
            lblTime.Text = "Time: 0";
            // 
            // lblInfo
            // 
            lblInfo.AutoSize = true;
            lblInfo.Font = new Font("Segoe UI", 20F);
            lblInfo.Location = new Point(125, 497);
            lblInfo.Name = "lblInfo";
            lblInfo.Size = new Size(770, 54);
            lblInfo.TabIndex = 2;
            lblInfo.Text = "Stay as long as possible. Your time = score";
            lblInfo.Click += lblInfo_Click;
            // 
            // btnStart
            // 
            btnStart.BackColor = Color.Green;
            btnStart.FlatAppearance.BorderSize = 0;
            btnStart.FlatStyle = FlatStyle.Flat;
            btnStart.Font = new Font("Segoe UI", 12F, FontStyle.Bold, GraphicsUnit.Point, 0);
            btnStart.Location = new Point(183, 343);
            btnStart.Name = "btnStart";
            btnStart.Size = new Size(179, 69);
            btnStart.TabIndex = 3;
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
            btnStop.Location = new Point(700, 343);
            btnStop.Name = "btnStop";
            btnStop.Size = new Size(179, 69);
            btnStop.TabIndex = 4;
            btnStop.Text = "End Game";
            btnStop.UseVisualStyleBackColor = false;
            btnStop.Click += btnStop_Click;
            // 
            // gameTimer
            // 
            gameTimer.Interval = 1000;
            gameTimer.Tick += GameTimer_Tick;
            // 
            // FakeGame2
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
            Name = "FakeGame2";
            Text = "FakeGame2";
            Load += FakeGame2_Load;
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