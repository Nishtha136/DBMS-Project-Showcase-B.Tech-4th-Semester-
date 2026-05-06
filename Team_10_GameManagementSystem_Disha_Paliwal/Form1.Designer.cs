using System;
using System.Windows.Forms;
using System.Drawing;

namespace GameManagementSystem
{
    partial class Form1
    {
        /// <summary>
        ///  Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        ///  Clean up any resources being used.
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
        ///  Required method for Designer support - do not modify
        ///  the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            button1 = new Button();
            dataGridView1 = new DataGridView();
            label1 = new Label();
            label2 = new Label();
            label3 = new Label();
            textBox1 = new TextBox();
            textBox2 = new TextBox();
            button2 = new Button();
            labelStatus = new Label();
            labelError = new Label();
            ((System.ComponentModel.ISupportInitialize)dataGridView1).BeginInit();
            SuspendLayout();
            // 
            // button1
            // 
            button1.BackColor = Color.OliveDrab;
            button1.FlatAppearance.BorderSize = 0;
            button1.FlatStyle = FlatStyle.Flat;
            button1.Font = new Font("Segoe UI Black", 16F, FontStyle.Bold, GraphicsUnit.Point, 0);
            button1.Location = new Point(514, 663);
            button1.Name = "button1";
            button1.Size = new Size(524, 63);
            button1.TabIndex = 0;
            button1.Text = "Log In";
            button1.UseVisualStyleBackColor = false;
            button1.Click += button1_Click;
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
            dataGridView1.TabIndex = 1;
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
            label1.TabIndex = 2;
            label1.Text = "GAMEVERSE";
            label1.Click += label1_Click;
            // 
            // label2
            // 
            label2.AutoSize = true;
            label2.BackColor = Color.DarkOliveGreen;
            label2.Font = new Font("Segoe UI Black", 20F, FontStyle.Bold);
            label2.Location = new Point(504, 282);
            label2.Name = "label2";
            label2.Size = new Size(218, 54);
            label2.TabIndex = 3;
            label2.Text = "Username";
            label2.Click += label2_Click;
            // 
            // label3
            // 
            label3.AutoSize = true;
            label3.BackColor = Color.DarkOliveGreen;
            label3.Font = new Font("Segoe UI Black", 20F, FontStyle.Bold);
            label3.Location = new Point(504, 449);
            label3.Name = "label3";
            label3.Size = new Size(211, 54);
            label3.TabIndex = 4;
            label3.Text = "Password";
            // 
            // textBox1
            // 
            textBox1.BackColor = Color.Olive;
            textBox1.BorderStyle = BorderStyle.None;
            textBox1.Font = new Font("Segoe UI Black", 17F);
            textBox1.ForeColor = SystemColors.ControlText;
            textBox1.Location = new Point(514, 357);
            textBox1.Name = "textBox1";
            textBox1.PlaceholderText = "Enter Username";
            textBox1.Size = new Size(524, 46);
            textBox1.TabIndex = 5;
            textBox1.TextChanged += textBox1_TextChanged;
            // 
            // textBox2
            // 
            textBox2.BackColor = Color.Olive;
            textBox2.BorderStyle = BorderStyle.None;
            textBox2.Font = new Font("Segoe UI Black", 17F);
            textBox2.ForeColor = SystemColors.InfoText;
            textBox2.Location = new Point(514, 525);
            textBox2.Name = "textBox2";
            textBox2.PlaceholderText = "Enter Password";
            textBox2.Size = new Size(524, 46);
            textBox2.TabIndex = 6;
            textBox2.UseSystemPasswordChar = true;
            // 
            // button2
            // 
            button2.BackColor = Color.DarkOliveGreen;
            button2.FlatAppearance.BorderSize = 0;
            button2.FlatStyle = FlatStyle.Flat;
            button2.Font = new Font("Segoe UI", 12F);
            button2.ForeColor = Color.DarkSeaGreen;
            button2.Location = new Point(535, 732);
            button2.Name = "button2";
            button2.Size = new Size(485, 34);
            button2.TabIndex = 7;
            button2.Text = "Don't have an account? Create one";
            button2.UseVisualStyleBackColor = false;
            button2.Click += button2_Click;
            // 
            // labelStatus
            // 
            labelStatus.AutoSize = true;
            labelStatus.BackColor = Color.DarkOliveGreen;
            labelStatus.Font = new Font("Segoe UI", 12F, FontStyle.Regular, GraphicsUnit.Point, 0);
            labelStatus.ForeColor = Color.Red;
            labelStatus.Location = new Point(514, 772);
            labelStatus.Name = "labelStatus";
            labelStatus.Size = new Size(0, 32);
            labelStatus.TabIndex = 8;
            // 
            // labelError
            // 
            labelError.AutoSize = true;
            labelError.BackColor = Color.DarkOliveGreen;
            labelError.Font = new Font("Segoe UI", 11F, FontStyle.Bold);
            labelError.ForeColor = Color.Red;
            labelError.Location = new Point(673, 769);
            labelError.Name = "labelError";
            labelError.Size = new Size(206, 30);
            labelError.TabIndex = 9;
            labelError.Text = "Invalid Credentials";
            labelError.Visible = false;
            // 
            // Form1
            // 
            AutoScaleDimensions = new SizeF(10F, 25F);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(1560, 833);
            Controls.Add(labelError);
            Controls.Add(button2);
            Controls.Add(textBox2);
            Controls.Add(textBox1);
            Controls.Add(label3);
            Controls.Add(label2);
            Controls.Add(label1);
            Controls.Add(button1);
            Controls.Add(dataGridView1);
            Controls.Add(labelStatus);
            Name = "Form1";
            Text = "Form1";
            Load += Form1_Load;
            ((System.ComponentModel.ISupportInitialize)dataGridView1).EndInit();
            ResumeLayout(false);
            PerformLayout();
        }

        #endregion

        private Button button1;
        private DataGridView dataGridView1;
        private Label label1;
        private Label label2;
        private Label label3;
        private TextBox textBox1;
        private TextBox textBox2;
        private Button button2;
        private Label labelStatus;
        private Label labelError;
    }
}
