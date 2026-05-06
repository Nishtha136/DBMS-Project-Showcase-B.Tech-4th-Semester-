using MySql.Data.MySqlClient;
using System.Data;
using System;
using System.Windows.Forms;
using System.Drawing;
namespace GameManagementSystem
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void button1_Click(object sender, EventArgs e)
        {
            labelError.Visible = false;

            // CLEAN INPUT (IMPORTANT)
            string username = textBox1.Text.Trim();
            string password = textBox2.Text.Trim();

            // block placeholder / empty
            if (string.IsNullOrWhiteSpace(username) ||
                string.IsNullOrWhiteSpace(password) ||
                username.Equals("Enter Username", StringComparison.OrdinalIgnoreCase) ||
                password.Equals("Enter Password", StringComparison.OrdinalIgnoreCase))
            {
                labelError.Text = "Invalid Credentials";
                labelError.Visible = true;
                return;
            }

            string connStr = DB.connStr;

            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                try
                {
                    conn.Open();

                    string query = "SELECT user_id FROM users WHERE username=@u AND password=@p LIMIT 1";

                    MySqlCommand cmd = new MySqlCommand(query, conn);
                    cmd.Parameters.AddWithValue("@u", username);   // use cleaned value
                    cmd.Parameters.AddWithValue("@p", password);

                    object result = cmd.ExecuteScalar();

                    if (result != null)
                    {
                        string uid = result.ToString();

                        MessageBox.Show("Login Successful!");

                        if (uid.StartsWith("p_"))
                        {
                            PlayerDashboard p = new PlayerDashboard(uid);
                            p.Show();
                        }
                        else if (uid.StartsWith("d_"))
                        {
                            DeveloperDashBoard d = new DeveloperDashBoard(uid);
                            d.Show();
                        }
                        else if (uid.StartsWith("a_"))
                        {
                            AdminDashBoard a = new AdminDashBoard(uid);
                            a.Show();
                        }
                        else
                        {
                            MessageBox.Show("Unknown role!");
                            return;
                        }

                        this.Hide();
                    }
                    else
                    {
                        labelError.Text = "Invalid Credentials";
                        labelError.Visible = true;
                    }
                }
                catch (Exception ex)
                {
                    // show diagnostic information to help debugging
                    labelError.Text = "Invalid Credentials";
                    labelError.Visible = true;
                    MessageBox.Show(ex.ToString(), "Login error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }

        private void Form1_Load(object sender, EventArgs e)
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

        private void label1_Click(object sender, EventArgs e)
        {

        }

        private void textBox1_TextChanged(object sender, EventArgs e)
        {

        }

        private void button2_Click(object sender, EventArgs e)
        {
            FormSignUp s = new FormSignUp();
            s.Show();
            this.Hide();
        }

        private void label2_Click(object sender, EventArgs e)
        {

        }
    }
}
