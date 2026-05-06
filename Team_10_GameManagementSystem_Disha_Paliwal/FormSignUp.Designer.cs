using System;
using System.Windows.Forms;
using System.Drawing;

namespace GameManagementSystem
{
    partial class FormSignUp
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
            dataGridView1 = new DataGridView();
            label1 = new Label();
            label2 = new Label();
            label3 = new Label();
            label4 = new Label();
            label5 = new Label();
            textBox1 = new TextBox();
            textBox2 = new TextBox();
            textBox3 = new TextBox();
            textBox4 = new TextBox();
            button1 = new Button();
            button2 = new Button();
            label6 = new Label();
            comboBox1 = new ComboBox();
            ((System.ComponentModel.ISupportInitialize)dataGridView1).BeginInit();
            SuspendLayout();
            // 
            // dataGridView1
            // 
            dataGridView1.BackgroundColor = Color.DarkOliveGreen;
            dataGridView1.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            dataGridView1.GridColor = Color.DarkOliveGreen;
            dataGridView1.Location = new Point(2, 2);
            dataGridView1.Name = "dataGridView1";
            dataGridView1.RowHeadersWidth = 62;
            dataGridView1.Size = new Size(1566, 836);
            dataGridView1.TabIndex = 0;
            // 
            // label1
            // 
            label1.AutoSize = true;
            label1.BackColor = Color.DarkOliveGreen;
            label1.Font = new Font("Segoe UI Black", 28F, FontStyle.Bold);
            label1.ForeColor = Color.DarkSeaGreen;
            label1.Location = new Point(587, 122);
            label1.Name = "label1";
            label1.Size = new Size(372, 74);
            label1.TabIndex = 1;
            label1.Text = "GAMEVERSE";
            // 
            // label2
            // 
            label2.AutoSize = true;
            label2.BackColor = Color.DarkOliveGreen;
            label2.Font = new Font("Segoe UI Black", 20F, FontStyle.Bold);
            label2.Location = new Point(471, 196);
            label2.Name = "label2";
            label2.Size = new Size(155, 54);
            label2.TabIndex = 2;
            label2.Text = "UserID";
            // 
            // label3
            // 
            label3.AutoSize = true;
            label3.BackColor = Color.DarkOliveGreen;
            label3.Font = new Font("Segoe UI Black", 20F, FontStyle.Bold);
            label3.Location = new Point(471, 292);
            label3.Name = "label3";
            label3.Size = new Size(218, 54);
            label3.TabIndex = 3;
            label3.Text = "Username";
            // 
            // label4
            // 
            label4.AutoSize = true;
            label4.BackColor = Color.DarkOliveGreen;
            label4.Font = new Font("Segoe UI Black", 20F, FontStyle.Bold);
            label4.Location = new Point(471, 389);
            label4.Name = "label4";
            label4.Size = new Size(299, 54);
            label4.TabIndex = 4;
            label4.Text = "Email Address";
            label4.Click += label4_Click;
            // 
            // label5
            // 
            label5.AutoSize = true;
            label5.BackColor = Color.DarkOliveGreen;
            label5.Font = new Font("Segoe UI Black", 20F, FontStyle.Bold);
            label5.Location = new Point(471, 484);
            label5.Name = "label5";
            label5.Size = new Size(211, 54);
            label5.TabIndex = 5;
            label5.Text = "Password";
            label5.Click += label5_Click;
            // 
            // textBox1
            // 
            textBox1.BackColor = Color.Olive;
            textBox1.BorderStyle = BorderStyle.None;
            textBox1.Font = new Font("Segoe UI Black", 17F);
            textBox1.Location = new Point(480, 243);
            textBox1.Name = "textBox1";
            textBox1.PlaceholderText = "Enter UserID";
            textBox1.Size = new Size(524, 46);
            textBox1.TabIndex = 6;
            // 
            // textBox2
            // 
            textBox2.BackColor = Color.Olive;
            textBox2.BorderStyle = BorderStyle.None;
            textBox2.Font = new Font("Segoe UI Black", 17F);
            textBox2.Location = new Point(480, 340);
            textBox2.Name = "textBox2";
            textBox2.PlaceholderText = "Enter Username";
            textBox2.Size = new Size(524, 46);
            textBox2.TabIndex = 7;
            textBox2.TextChanged += textBox2_TextChanged;
            // 
            // textBox3
            // 
            textBox3.BackColor = Color.Olive;
            textBox3.BorderStyle = BorderStyle.None;
            textBox3.Font = new Font("Segoe UI Black", 17F);
            textBox3.Location = new Point(480, 435);
            textBox3.Name = "textBox3";
            textBox3.PlaceholderText = "Enter Email Address";
            textBox3.Size = new Size(524, 46);
            textBox3.TabIndex = 8;
            // 
            // textBox4
            // 
            textBox4.BackColor = Color.Olive;
            textBox4.BorderStyle = BorderStyle.None;
            textBox4.Font = new Font("Segoe UI Black", 17F);
            textBox4.Location = new Point(480, 532);
            textBox4.Name = "textBox4";
            textBox4.PlaceholderText = "Enter Password";
            textBox4.Size = new Size(524, 46);
            textBox4.TabIndex = 9;
            // 
            // button1
            // 
            button1.BackColor = Color.OliveDrab;
            button1.FlatAppearance.BorderSize = 0;
            button1.FlatStyle = FlatStyle.Flat;
            button1.Font = new Font("Segoe UI Black", 16F, FontStyle.Bold);
            button1.Location = new Point(480, 715);
            button1.Name = "button1";
            button1.Size = new Size(524, 63);
            button1.TabIndex = 10;
            button1.Text = "Sign Up";
            button1.UseVisualStyleBackColor = false;
            button1.Click += button1_Click;
            // 
            // button2
            // 
            button2.BackColor = Color.DarkOliveGreen;
            button2.FlatAppearance.BorderSize = 0;
            button2.FlatStyle = FlatStyle.Flat;
            button2.Font = new Font("Segoe UI", 12F);
            button2.ForeColor = Color.DarkSeaGreen;
            button2.Location = new Point(498, 784);
            button2.Name = "button2";
            button2.Size = new Size(485, 45);
            button2.TabIndex = 11;
            button2.Text = "Already have an account? LogIn";
            button2.UseVisualStyleBackColor = false;
            // 
            // label6
            // 
            label6.AutoSize = true;
            label6.BackColor = Color.DarkOliveGreen;
            label6.Font = new Font("Segoe UI Black", 20F, FontStyle.Bold);
            label6.Location = new Point(480, 581);
            label6.Name = "label6";
            label6.Size = new Size(109, 54);
            label6.TabIndex = 12;
            label6.Text = "Role";
            // 
            // comboBox1
            // 
            comboBox1.BackColor = Color.Olive;
            comboBox1.DropDownStyle = ComboBoxStyle.DropDownList;
            comboBox1.FlatStyle = FlatStyle.Flat;
            comboBox1.Font = new Font("Segoe UI Black", 17F);
            comboBox1.ForeColor = Color.LightYellow;
            comboBox1.FormattingEnabled = true;
            comboBox1.Items.AddRange(new object[] { "Player", "Developer", "Admin" });
            comboBox1.Location = new Point(480, 627);
            comboBox1.Name = "comboBox1";
            comboBox1.Size = new Size(524, 54);
            comboBox1.TabIndex = 13;
            comboBox1.SelectedIndexChanged += comboBox1_SelectedIndexChanged;
            // 
            // FormSignUp
            // 
            AutoScaleDimensions = new SizeF(10F, 25F);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(1560, 833);
            Controls.Add(comboBox1);
            Controls.Add(label6);
            Controls.Add(button2);
            Controls.Add(button1);
            Controls.Add(textBox4);
            Controls.Add(textBox3);
            Controls.Add(textBox2);
            Controls.Add(textBox1);
            Controls.Add(label5);
            Controls.Add(label4);
            Controls.Add(label3);
            Controls.Add(label2);
            Controls.Add(label1);
            Controls.Add(dataGridView1);
            Name = "FormSignUp";
            Text = "FormSignUp";
            Load += FormSignUp_Load;
            ((System.ComponentModel.ISupportInitialize)dataGridView1).EndInit();
            ResumeLayout(false);
            PerformLayout();
        }

        #endregion

        private DataGridView dataGridView1;
        private Label label1;
        private Label label2;
        private Label label3;
        private Label label4;
        private Label label5;
        private TextBox textBox1;
        private TextBox textBox2;
        private TextBox textBox3;
        private TextBox textBox4;
        private Button button1;
        private Button button2;
        private Label label6;
        private ComboBox comboBox1;
    }
}