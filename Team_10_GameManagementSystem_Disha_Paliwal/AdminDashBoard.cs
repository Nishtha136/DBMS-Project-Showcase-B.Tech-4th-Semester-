using System;
using System.Data;
using System.Windows.Forms;
using MySql.Data.MySqlClient;
using System.Drawing;

namespace GameManagementSystem
{
    public partial class AdminDashBoard : Form
    {
        string userId;
        string connStr = DB.connStr;

        public AdminDashBoard(string uid)
        {
            InitializeComponent();
            userId = uid;
        }

        private void AdminDashBoard_Load(object sender, EventArgs e)
        {
            this.WindowState = FormWindowState.Maximized;
            ApplyThemeToAllGrids();
            LoadHeaderData();
            LoadPendingGames();
            LoadGameHistory();
            LoadAdminWalletData();
        }

        private void ApplyThemeToAllGrids()
        {
            DataGridView[] grids = {
                dgvPendingGames, dgvGameHistory, dgvAdminTransactions
            };

            foreach (var grid in grids)
            {
                if (grid == null) continue;
                grid.BackgroundColor = Color.DarkOliveGreen;
                grid.BorderStyle = BorderStyle.None;
                grid.CellBorderStyle = DataGridViewCellBorderStyle.SingleHorizontal;
                grid.DefaultCellStyle.BackColor = Color.DarkOliveGreen;
                grid.DefaultCellStyle.ForeColor = Color.White;
                grid.DefaultCellStyle.SelectionBackColor = Color.OliveDrab;
                grid.DefaultCellStyle.SelectionForeColor = Color.White;
                grid.DefaultCellStyle.Font = new Font("Segoe UI", 10F);
                grid.DefaultCellStyle.Padding = new Padding(5);

                grid.ColumnHeadersBorderStyle = DataGridViewHeaderBorderStyle.None;
                grid.ColumnHeadersDefaultCellStyle.BackColor = Color.DarkGreen;
                grid.ColumnHeadersDefaultCellStyle.ForeColor = Color.White;
                grid.ColumnHeadersDefaultCellStyle.Font = new Font("Segoe UI", 11F, FontStyle.Bold);
                grid.ColumnHeadersDefaultCellStyle.Padding = new Padding(5);
                grid.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
                grid.ColumnHeadersHeight = 40;

                grid.EnableHeadersVisualStyles = false;
                grid.RowHeadersVisible = false;
                grid.SelectionMode = DataGridViewSelectionMode.FullRowSelect;
                grid.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.AllCells;
                grid.AllowUserToAddRows = false;
                grid.AllowUserToDeleteRows = false;
                grid.AllowUserToResizeRows = false;
                grid.ReadOnly = true;
                grid.GridColor = Color.OliveDrab;

                grid.RowTemplate.Height = 35;
                grid.AutoSizeRowsMode = DataGridViewAutoSizeRowsMode.AllCells;
            }
        }

        private void LoadHeaderData()
        {
            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                try
                {
                    conn.Open();
                    MySqlCommand cmdUser = new MySqlCommand("SELECT username, email FROM users WHERE user_id=@uid", conn);
                    cmdUser.Parameters.AddWithValue("@uid", userId);
                    using (MySqlDataReader reader = cmdUser.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            labelWelcome.Text = "Welcome, " + reader["username"].ToString() + "!";
                            labelEmail.Text = reader["email"].ToString();
                        }
                    }

                    RefreshBalance(conn);
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Error loading header: " + ex.Message);
                }
            }
        }

        private void RefreshBalance(MySqlConnection conn)
        {
            EnsureWalletExists(userId, conn, null);
            MySqlCommand cmdBalance = new MySqlCommand("SELECT balance FROM wallet WHERE user_id=@uid", conn);
            cmdBalance.Parameters.AddWithValue("@uid", userId);
            object balance = cmdBalance.ExecuteScalar();
            string balText = "Revenue: ₹" + (balance != null ? Convert.ToDecimal(balance).ToString("N2") : "0.00");
            labelBalance.Text = balText;
        }

        private void EnsureWalletExists(string uid, MySqlConnection conn, MySqlTransaction trans)
        {
            string checkQuery = "SELECT COUNT(*) FROM wallet WHERE user_id=@uid";
            MySqlCommand cmdCheck = (trans != null) ? new MySqlCommand(checkQuery, conn, trans) : new MySqlCommand(checkQuery, conn);
            cmdCheck.Parameters.AddWithValue("@uid", uid);
            int count = Convert.ToInt32(cmdCheck.ExecuteScalar());

            if (count == 0)
            {
                string insQuery = "INSERT INTO wallet (user_id, balance) VALUES (@uid, 0)";
                MySqlCommand cmdIns = (trans != null) ? new MySqlCommand(insQuery, conn, trans) : new MySqlCommand(insQuery, conn);
                cmdIns.Parameters.AddWithValue("@uid", uid);
                cmdIns.ExecuteNonQuery();
            }
        }

        private void LoadPendingGames()
        {
            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                try
                {
                    conn.Open();
                    string query = @"SELECT g.game_id, g.title, g.genre, g.price, g.developer_id, u.username AS developer_name 
                        FROM game g JOIN users u ON g.developer_id = u.user_id 
                        WHERE g.approval_status = 'pending'";
                    MySqlDataAdapter da = new MySqlDataAdapter(query, conn);
                    DataTable dt = new DataTable();
                    da.Fill(dt);
                    dgvPendingGames.DataSource = dt;
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Error loading pending games: " + ex.Message);
                }
            }
        }

        private void LoadGameHistory()
        {
            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                try
                {
                    conn.Open();
                    // We join with the transaction table to find which admin earned the commission for approving the game.
                    string query = @"
                        SELECT g.game_id, g.title, g.genre, g.price, g.developer_id,
                               ud.username AS developer_name, g.approval_status AS Status 
                        FROM game g
                        JOIN transaction t ON t.reference_id = CONCAT('COMM_', g.game_id)
                        JOIN users ud ON g.developer_id = ud.user_id
                        WHERE g.approval_status = 'approved' AND t.user_id = @uid";
                    MySqlCommand cmd = new MySqlCommand(query, conn);
                    cmd.Parameters.AddWithValue("@uid", userId);
                    MySqlDataAdapter da = new MySqlDataAdapter(cmd);
                    DataTable dt = new DataTable();
                    da.Fill(dt);
                    dgvGameHistory.DataSource = dt;
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Error loading history: " + ex.Message);
                }
            }
        }

        private void LoadAdminWalletData()
        {
            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                try
                {
                    conn.Open();
                    // Uses VIEW: vw_transaction_history (JOIN of transaction + users)
                    string queryTrans = @"SELECT transaction_id, amount AS Amount, transaction_type AS Type, 
                        description AS Description, payment_method AS Method,
                        transaction_status AS Status, created_at AS Date 
                        FROM vw_transaction_history WHERE username = (SELECT username FROM users WHERE user_id=@uid) ORDER BY created_at DESC";
                    MySqlDataAdapter da = new MySqlDataAdapter(queryTrans, conn);
                    da.SelectCommand.Parameters.AddWithValue("@uid", userId);
                    DataTable dt = new DataTable();
                    da.Fill(dt);
                    dgvAdminTransactions.DataSource = dt;
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Error loading wallet: " + ex.Message);
                }
            }
        }

        private void btnApproveGame_Click(object sender, EventArgs e)
        {
            if (dgvPendingGames.CurrentRow == null) return;

            int gameId = Convert.ToInt32(dgvPendingGames.CurrentRow.Cells["game_id"].Value);
            string devId = dgvPendingGames.CurrentRow.Cells["developer_id"].Value.ToString();
            decimal price = Convert.ToDecimal(dgvPendingGames.CurrentRow.Cells["price"].Value);
            string gameTitle = dgvPendingGames.CurrentRow.Cells["title"].Value.ToString();

            decimal devAmount = price * 0.95m;
            decimal adminAmount = price * 0.05m;

            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                try
                {
                    conn.Open();
                    EnsureWalletExists(userId, conn, null);
                    EnsureWalletExists(devId, conn, null);

                    MySqlTransaction trans = conn.BeginTransaction();
                    try
                    {
                        MySqlCommand cmdGame = new MySqlCommand("UPDATE game SET approval_status='approved', approved_by=@admin WHERE game_id=@gid", conn, trans);
                        cmdGame.Parameters.AddWithValue("@gid", gameId);
                        cmdGame.Parameters.AddWithValue("@admin", userId);
                        cmdGame.ExecuteNonQuery();

                        MySqlCommand cmdDevWallet = new MySqlCommand("UPDATE wallet SET balance = balance + @amt WHERE user_id=@uid", conn, trans);
                        cmdDevWallet.Parameters.AddWithValue("@amt", devAmount);
                        cmdDevWallet.Parameters.AddWithValue("@uid", devId);
                        cmdDevWallet.ExecuteNonQuery();

                        MySqlCommand cmdAdminWallet = new MySqlCommand("UPDATE wallet SET balance = balance + @amt WHERE user_id=@uid", conn, trans);
                        cmdAdminWallet.Parameters.AddWithValue("@amt", adminAmount);
                        cmdAdminWallet.Parameters.AddWithValue("@uid", userId);
                        cmdAdminWallet.ExecuteNonQuery();

                        MySqlCommand cmdTDev = new MySqlCommand("INSERT INTO transaction(user_id, amount, description, transaction_type, reference_id, payment_method, transaction_status) VALUES(@uid, @amt, @desc, 'credit', @ref, 'System', 'completed')", conn, trans);
                        cmdTDev.Parameters.AddWithValue("@uid", devId);
                        cmdTDev.Parameters.AddWithValue("@amt", devAmount);
                        cmdTDev.Parameters.AddWithValue("@ref", "GAME_" + gameId);
                        cmdTDev.Parameters.AddWithValue("@desc", "Sale: " + gameTitle);
                        cmdTDev.ExecuteNonQuery();

                        MySqlCommand cmdTAdmin = new MySqlCommand("INSERT INTO transaction(user_id, amount, description, transaction_type, reference_id, payment_method, transaction_status) VALUES(@uid, @amt, @desc, 'credit', @ref, 'System', 'completed')", conn, trans);
                        cmdTAdmin.Parameters.AddWithValue("@uid", userId);
                        cmdTAdmin.Parameters.AddWithValue("@amt", adminAmount);
                        cmdTAdmin.Parameters.AddWithValue("@ref", "COMM_" + gameId);
                        cmdTAdmin.Parameters.AddWithValue("@desc", "Commission: " + gameTitle + " (₹" + price + ")");
                        cmdTAdmin.ExecuteNonQuery();

                        trans.Commit();
                        MessageBox.Show("Game Approved! 5% commission added to your wallet.");
                        RefreshAll();
                    }
                    catch (Exception ex)
                    {
                        trans.Rollback();
                        MessageBox.Show("Transaction Failed: " + ex.Message);
                    }
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Database Error: " + ex.Message);
                }
            }
        }

        private void btnRejectGame_Click(object sender, EventArgs e)
        {
            if (dgvPendingGames.CurrentRow == null) return;
            int gameId = Convert.ToInt32(dgvPendingGames.CurrentRow.Cells["game_id"].Value);

            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                try
                {
                    conn.Open();
                    MySqlCommand cmd = new MySqlCommand("UPDATE game SET approval_status='rejected' WHERE game_id=@gid", conn);
                    cmd.Parameters.AddWithValue("@gid", gameId);
                    cmd.ExecuteNonQuery();
                    MessageBox.Show("Game Rejected.");
                    RefreshAll();
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Error: " + ex.Message);
                }
            }
        }

        private void RefreshAll()
        {
            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                conn.Open();
                RefreshBalance(conn);
            }
            LoadPendingGames();
            LoadGameHistory();
            LoadAdminWalletData();
        }
        private void btnLogout_Click(object sender, EventArgs e)
        {
            Form1 f1 = new Form1();
            f1.Show();
            this.Close();
        }

        private void btnRefreshPending_Click(object sender, EventArgs e)
        {
            LoadPendingGames();
            MessageBox.Show("Refreshed! ✅", "Pending Requests", MessageBoxButtons.OK, MessageBoxIcon.None);
        }

        private void btnRefreshApprovals_Click(object sender, EventArgs e)
        {
            LoadGameHistory();
            MessageBox.Show("Refreshed! ✅", "Game Approvals", MessageBoxButtons.OK, MessageBoxIcon.None);
        }

        private void btnRefreshWallet_Click(object sender, EventArgs e)
        {
            LoadAdminWalletData();
            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                conn.Open();
                RefreshBalance(conn);
            }
            MessageBox.Show("Refreshed! ✅", "Admin Wallet", MessageBoxButtons.OK, MessageBoxIcon.None);
        }
    }
}
