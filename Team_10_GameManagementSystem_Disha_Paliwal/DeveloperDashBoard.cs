using MySql.Data.MySqlClient;
using System;
using System.Data;
using System.Windows.Forms;

namespace GameManagementSystem
{
    public partial class DeveloperDashBoard : Form
    {
        string userId;
        string connStr = DB.connStr;

        public DeveloperDashBoard(string uid)
        {
            InitializeComponent();
            userId = uid;
        }

        private void DeveloperDashBoard_Load(object sender, EventArgs e)
        {
            try
            {
                ApplyThemeToAllGrids();

                // 🔥 Important for selection fix
                dataGridRequests.SelectionMode = DataGridViewSelectionMode.FullRowSelect;
                dataGridRequests.MultiSelect = false;

                LoadProfile();
                LoadSummary();
                LoadGames();
                LoadBuyers();
                LoadMatchHistory();
                LoadFriends();
                LoadFriendRequests();
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.ToString());
            }
        }

        // 🔹 PROFILE
        private void ApplyThemeToAllGrids()
        {
            DataGridView[] grids = {
                dataGridGames, dataGridMatches, 
                dataGridRequests, dataGridFriends, dataGridView2
            };

            foreach (var grid in grids)
            {
                if (grid == null) continue;

                grid.BackgroundColor = System.Drawing.Color.DarkOliveGreen;
                grid.BorderStyle = BorderStyle.None;
                grid.CellBorderStyle = DataGridViewCellBorderStyle.SingleHorizontal;
                grid.DefaultCellStyle.BackColor = System.Drawing.Color.DarkOliveGreen;
                grid.DefaultCellStyle.ForeColor = System.Drawing.Color.White;
                grid.DefaultCellStyle.SelectionBackColor = System.Drawing.Color.OliveDrab;
                grid.DefaultCellStyle.SelectionForeColor = System.Drawing.Color.White;
                grid.DefaultCellStyle.Font = new System.Drawing.Font("Segoe UI", 10F);
                grid.DefaultCellStyle.Padding = new Padding(5);

                grid.ColumnHeadersBorderStyle = DataGridViewHeaderBorderStyle.None;
                grid.ColumnHeadersDefaultCellStyle.BackColor = System.Drawing.Color.DarkGreen;
                grid.ColumnHeadersDefaultCellStyle.ForeColor = System.Drawing.Color.White;
                grid.ColumnHeadersDefaultCellStyle.Font = new System.Drawing.Font("Segoe UI", 11F, System.Drawing.FontStyle.Bold);
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
                grid.GridColor = System.Drawing.Color.OliveDrab;

                // Increase row height for better text visibility
                grid.RowTemplate.Height = 35;
                grid.AutoSizeRowsMode = DataGridViewAutoSizeRowsMode.AllCells;
            }
        }

        private void LoadProfile()
        {
            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                conn.Open();

                string q = @"SELECT u.username, u.email, d.studio_name 
                             FROM users u 
                             JOIN developer d ON u.user_id = d.user_id 
                             WHERE u.user_id = @id";

                MySqlCommand cmd = new MySqlCommand(q, conn);
                cmd.Parameters.AddWithValue("@id", userId);

                var r = cmd.ExecuteReader();

                if (r.Read())
                {
                    labelWelcome.Text = "Welcome, " + r["username"].ToString();
                    labelEmail.Text = "Email: " + r["email"].ToString();
                    labelStudio.Text = "Studio: " + r["studio_name"].ToString();
                }
            }
        }

        // Uses VIEW: vw_developer_revenue for summary stats
        private void LoadSummary()
        {
            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                conn.Open();

                // Uses VIEW vw_developer_revenue (JOIN of developer + users + game + purchase with GROUP BY)
                var cmd = new MySqlCommand(
                    @"SELECT total_games, total_sales, total_revenue
                      FROM vw_developer_revenue WHERE developer_id = @id", conn);
                cmd.Parameters.AddWithValue("@id", userId);

                var r = cmd.ExecuteReader();
                if (r.Read())
                {
                    labelTotalGames.Text = "Games: " + r["total_games"].ToString();
                    labelSales.Text = "Sales: " + r["total_sales"].ToString();
                    labelRevenue.Text = "Revenue: ₹" + r["total_revenue"].ToString();
                }
                r.Close();

                var cmd3 = new MySqlCommand(@"
                    SELECT COUNT(*) FROM match_session m
                    JOIN game g ON m.game_id=g.game_id
                    WHERE g.developer_id=@id", conn);

                cmd3.Parameters.AddWithValue("@id", userId);
                labelMatches.Text = "Matches: " + cmd3.ExecuteScalar().ToString();
            }
        }

        // 🔹 MY GAMES
        private void LoadGames()
        {
            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                conn.Open();

                string q = @"
                SELECT 
                    g.game_id,
                    g.title,
                    g.genre,
                    g.price,
                    g.release_date,
                    g.approval_status,
                    IFNULL(ua.username, '-') AS approved_by_admin,
                    COUNT(DISTINCT m.match_id) AS total_matches
                FROM game g
                LEFT JOIN match_session m ON g.game_id = m.game_id
                LEFT JOIN users ua ON g.approved_by = ua.user_id
                WHERE g.developer_id=@id
                GROUP BY g.game_id";

                MySqlDataAdapter da = new MySqlDataAdapter(q, conn);
                da.SelectCommand.Parameters.AddWithValue("@id", userId);

                DataTable dt = new DataTable();
                da.Fill(dt);

                dataGridGames.DataSource = dt;
            }
        }

        private void LoadBuyers()
        {
            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                conn.Open();

                string q = @"
                SELECT 
                    g.title AS 'Game Title',
                    g.price AS 'Price',
                    u.username AS 'Buyer Username',
                    u.email AS 'Buyer Email',
                    p.purchase_date AS 'Purchase Date'
                FROM purchase p
                JOIN game g ON p.game_id = g.game_id
                JOIN users u ON p.user_id = u.user_id
                WHERE g.developer_id = @id
                ORDER BY p.purchase_date DESC";

                MySqlDataAdapter da = new MySqlDataAdapter(q, conn);
                da.SelectCommand.Parameters.AddWithValue("@id", userId);

                DataTable dt = new DataTable();
                da.Fill(dt);

                dataGridView2.DataSource = dt;
            }
        }

        private void buttonRefreshPurchased_Click(object sender, EventArgs e)
        {
            LoadGames();
            LoadBuyers();
            MessageBox.Show("Refreshed! ✅", "My Games", MessageBoxButtons.OK, MessageBoxIcon.None);
        }

        private void LoadMatchHistory()
        {
            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                conn.Open();

                string q = @"
                SELECT 
                    m.match_id,
                    p.user_id AS Player_ID,
                    g.game_id,
                    g.title,
                    m.started_at,
                    m.ended_at,
                    m.duration
                FROM match_session m
                JOIN game g ON m.game_id = g.game_id
                LEFT JOIN participation p ON m.match_id = p.match_id
                WHERE g.developer_id=@id";

                MySqlDataAdapter da = new MySqlDataAdapter(q, conn);
                da.SelectCommand.Parameters.AddWithValue("@id", userId);

                DataTable dt = new DataTable();
                da.Fill(dt);

                dataGridMatches.DataSource = dt;
            }
        }

        // 🔹 MANAGE GAMES
        private void buttonAddGame_Click(object sender, EventArgs e)
        {
            string title = textBoxGameName.Text.Trim();
            string priceStr = textBoxGamePrice.Text.Trim();
            string genre = textBoxGameCategory.Text.Trim();

            if (string.IsNullOrEmpty(title) || string.IsNullOrEmpty(priceStr) || string.IsNullOrEmpty(genre))
            {
                MessageBox.Show("Please fill all fields.");
                return;
            }

            if (!decimal.TryParse(priceStr, out decimal price))
            {
                MessageBox.Show("Invalid price.");
                return;
            }

            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                try
                {
                    conn.Open();
                    MySqlCommand cmd = new MySqlCommand("INSERT INTO game (title, genre, price, release_date, developer_id, approval_status) VALUES (@t, @g, @p, NOW(), @d, 'pending')", conn);
                    cmd.Parameters.AddWithValue("@t", title);
                    cmd.Parameters.AddWithValue("@g", genre);
                    cmd.Parameters.AddWithValue("@p", price);
                    cmd.Parameters.AddWithValue("@d", userId);
                    cmd.ExecuteNonQuery();

                    MessageBox.Show("Game created! Request to Admin sent ✅", "Pending Approval", MessageBoxButtons.OK, MessageBoxIcon.None);
                    textBoxGameName.Text = "";
                    textBoxGamePrice.Text = "";
                    textBoxGameCategory.Text = "";
                    LoadGames();
                    LoadSummary();
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Error adding game: " + ex.Message);
                }
            }
        }

        private void buttonDeleteGame_Click(object sender, EventArgs e)
        {
            if (dataGridGames.CurrentRow == null)
            {
                MessageBox.Show("Select a game first!");
                return;
            }

            string gameId = dataGridGames.CurrentRow.Cells["game_id"].Value?.ToString();
            if (string.IsNullOrEmpty(gameId)) return;

            DialogResult res = MessageBox.Show("Are you sure you want to delete this game?", "Delete Game", MessageBoxButtons.YesNo, MessageBoxIcon.Warning);
            if (res == DialogResult.Yes)
            {
                using (MySqlConnection conn = new MySqlConnection(connStr))
                {
                    try
                    {
                        conn.Open();
                        MySqlCommand cmd = new MySqlCommand("DELETE FROM game WHERE game_id=@g AND developer_id=@d", conn);
                        cmd.Parameters.AddWithValue("@g", gameId);
                        cmd.Parameters.AddWithValue("@d", userId);
                        int affected = cmd.ExecuteNonQuery();
                        
                        if (affected > 0)
                        {
                            MessageBox.Show("Game deleted. 🗑️");
                            LoadGames();
                            LoadSummary();
                        }
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show("Could not delete game. It may be linked to existing purchases or matches.\nError: " + ex.Message);
                    }
                }
            }
        }

        private void LoadFriends()
        {
            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                try
                {
                    conn.Open();
                    DataTable dt = new DataTable();
                    MySqlDataAdapter da = new MySqlDataAdapter(
                        @"SELECT u.user_id AS FriendID, u.username AS FriendName, s.status AS Status
                          FROM friendship s
                          JOIN users u ON s.user_id_2 = u.user_id
                          WHERE s.user_id_1 = @id AND s.status = 'accepted'", conn);
                    da.SelectCommand.Parameters.AddWithValue("@id", userId);
                    da.Fill(dt);
                    dataGridFriends.DataSource = dt;
                    dataGridFriends.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
                }
                catch { }
            }
        }

        private void LoadFriendRequests()
        {
            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                try
                {
                    conn.Open();
                    DataTable dt = new DataTable();
                    MySqlDataAdapter da = new MySqlDataAdapter(
                        @"SELECT u.user_id AS SenderID, u.username AS SenderName, s.status AS Status
                          FROM friendship s
                          JOIN users u ON s.user_id_1 = u.user_id
                          WHERE s.user_id_2 = @id AND s.status = 'pending'", conn);
                    da.SelectCommand.Parameters.AddWithValue("@id", userId);
                    da.Fill(dt);
                    dataGridRequests.DataSource = dt;
                    dataGridRequests.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
                }
                catch { }
            }
        }

        private void buttonAddFriend_Click(object sender, EventArgs e)
        {
            string friendInput = textBoxFriend.Text.Trim();
            if (string.IsNullOrWhiteSpace(friendInput))
            {
                MessageBox.Show("Enter a Username to add as friend");
                return;
            }
            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                conn.Open();
                MySqlCommand findUser = new MySqlCommand("SELECT user_id FROM users WHERE username=@input OR user_id=@input LIMIT 1", conn);
                findUser.Parameters.AddWithValue("@input", friendInput);
                object result = findUser.ExecuteScalar();
                if (result == null)
                {
                    MessageBox.Show("User not found ❌");
                    return;
                }
                string friendId = result.ToString();
                if (friendId == userId)
                {
                    MessageBox.Show("You cannot add yourself as a friend ❌");
                    return;
                }
                if (friendId.StartsWith("a_"))
                {
                    MessageBox.Show("You cannot send friend requests to an Admin ❌");
                    return;
                }
                MySqlCommand checkFriend = new MySqlCommand(@"SELECT COUNT(*) FROM friendship WHERE user_id_1=@id AND user_id_2=@fid", conn);
                checkFriend.Parameters.AddWithValue("@id", userId);
                checkFriend.Parameters.AddWithValue("@fid", friendId);
                if (Convert.ToInt32(checkFriend.ExecuteScalar()) > 0)
                {
                    MessageBox.Show("Friend request already exists or you are already friends ❌");
                    return;
                }
                MySqlCommand insertCmd = new MySqlCommand("INSERT INTO friendship(user_id_1, user_id_2, status, created_at) VALUES(@id, @fid, 'pending', NOW())", conn);
                insertCmd.Parameters.AddWithValue("@id", userId);
                insertCmd.Parameters.AddWithValue("@fid", friendId);
                insertCmd.ExecuteNonQuery();
                MessageBox.Show("Friend Request Sent ✅");
                textBoxFriend.Text = "";
            }
            LoadFriends();
            LoadFriendRequests();
        }

        private void buttonAccept_Click(object sender, EventArgs e)
        {
            if (dataGridRequests.CurrentRow == null) { MessageBox.Show("Select a request first"); return; }
            string senderId = dataGridRequests.CurrentRow.Cells["SenderID"].Value?.ToString();
            if (string.IsNullOrEmpty(senderId)) return;
            
            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                conn.Open();
                MySqlCommand cmd = new MySqlCommand("UPDATE friendship SET status='accepted' WHERE user_id_1=@s AND user_id_2=@me", conn);
                cmd.Parameters.AddWithValue("@s", senderId);
                cmd.Parameters.AddWithValue("@me", userId);
                cmd.ExecuteNonQuery();

                MySqlCommand cmd2 = new MySqlCommand("INSERT IGNORE INTO friendship (user_id_1, user_id_2, status, created_at) VALUES (@me, @s, 'accepted', NOW())", conn);
                cmd2.Parameters.AddWithValue("@s", senderId);
                cmd2.Parameters.AddWithValue("@me", userId);
                cmd2.ExecuteNonQuery();

                MessageBox.Show("Friend Request Accepted ✅");
            }
            LoadFriends();
            LoadFriendRequests();
        }

        private void buttonReject_Click(object sender, EventArgs e)
        {
            if (dataGridRequests.CurrentRow == null) { MessageBox.Show("Select a request first"); return; }
            string senderId = dataGridRequests.CurrentRow.Cells["SenderID"].Value?.ToString();
            if (string.IsNullOrEmpty(senderId)) return;

            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                conn.Open();
                MySqlCommand cmd = new MySqlCommand("UPDATE friendship SET status='declined' WHERE user_id_1=@s AND user_id_2=@me", conn);
                cmd.Parameters.AddWithValue("@s", senderId);
                cmd.Parameters.AddWithValue("@me", userId);
                cmd.ExecuteNonQuery();
                MessageBox.Show("Friend Request Declined ❌");
            }
            LoadFriends();
            LoadFriendRequests();
        }

        private void buttonRefreshSocial_Click(object sender, EventArgs e)
        {
            LoadFriends();
            LoadFriendRequests();
            MessageBox.Show("Refreshed! ✅", "Social", MessageBoxButtons.OK, MessageBoxIcon.None);
        }

        // 🔹 LOGOUT
        private void btnLogout_Click(object sender, EventArgs e)
        {
            new Form1().Show();
            this.Close();
        }
    }
}