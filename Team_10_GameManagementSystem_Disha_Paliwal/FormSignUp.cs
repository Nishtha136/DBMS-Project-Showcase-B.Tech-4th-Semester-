using MySql.Data.MySqlClient;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Text;
using System.Windows.Forms;

namespace GameManagementSystem
{
    public partial class FormSignUp : Form
    {
        public FormSignUp()
        {
            InitializeComponent();
        }
        private void button1_Click(object sender, EventArgs e)
        {
            string userId = textBox1.Text.Trim();
            string username = textBox2.Text.Trim();
            string email = textBox3.Text.Trim();
            string password = textBox4.Text.Trim();

            // ❗ validation
            if (userId == "" || username == "" || email == "" || password == "")
            {
                MessageBox.Show("Fill all fields!");
                return;
            }

            if (!userId.StartsWith("p_") && !userId.StartsWith("d_") && !userId.StartsWith("a_"))
            {
                MessageBox.Show("UserID must start with p_, d_, or a_ ❌");
                return;
            }

            string connStr = DB.connStr;

            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                conn.Open();

                try
                {
                    //ac2 CALLS STORED PROCEDURE: sp_register_user
                    // The procedure internally uses START TRANSACTION + COMMIT/ROLLBACK
                    // and handles inserting into users, wallet, and role-specific table
                    MySqlCommand cmd = new MySqlCommand("CALL sp_register_user(@id, @name, @email, @pass)", conn);
                    cmd.Parameters.AddWithValue("@id", userId);
                    cmd.Parameters.AddWithValue("@name", username);
                    cmd.Parameters.AddWithValue("@email", email);
                    cmd.Parameters.AddWithValue("@pass", password);
                    cmd.ExecuteNonQuery();

                    MessageBox.Show("Account Created Successfully!");

                    // back to login
                    Form1 login = new Form1();
                    login.Show();
                    this.Hide();
                }
                catch (Exception ex)
                {
                    MessageBox.Show(ex.Message);
                }
            }
        }
        private void label5_Click(object sender, EventArgs e)
        {

        }

        private void textBox2_TextChanged(object sender, EventArgs e)
        {

        }

        private void label4_Click(object sender, EventArgs e)
        {

        }

        private void comboBox1_SelectedIndexChanged(object sender, EventArgs e)
        {

        }

        private void FormSignUp_Load(object sender, EventArgs e)
        {
            this.BackColor = Color.DarkOliveGreen;
            CenterControls();
        }

        private void CenterControls()
        {
            this.WindowState = FormWindowState.Maximized;
            
            Panel p = new Panel();
            int minX = int.MaxValue, minY = int.MaxValue, maxX = 0, maxY = 0;
            
            foreach (Control c in this.Controls)
            {
                if (c.Left < minX) minX = c.Left;
                if (c.Top < minY) minY = c.Top;
                if (c.Right > maxX) maxX = c.Right;
                if (c.Bottom > maxY) maxY = c.Bottom;
            }
            
            p.Size = new Size(maxX - minX, maxY - minY);
            
            Control[] ctrls = new Control[this.Controls.Count];
            this.Controls.CopyTo(ctrls, 0);
            
            foreach (Control c in ctrls)
            {
                c.Left -= minX;
                c.Top -= minY;
                p.Controls.Add(c);
            }
            
            p.Location = new Point((this.ClientSize.Width - p.Width) / 2, (this.ClientSize.Height - p.Height) / 2);
            p.Anchor = AnchorStyles.None;
            this.Controls.Add(p);

            this.Resize += (s, ev) => {
                p.Location = new Point((this.ClientSize.Width - p.Width) / 2, (this.ClientSize.Height - p.Height) / 2);
            };
        }
    }
}
