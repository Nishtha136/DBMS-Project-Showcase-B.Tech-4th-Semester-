using System;
using System.Data;
using System.Windows.Forms;
using System.Threading.Tasks;
using MySql.Data.MySqlClient;

namespace GameManagementSystem
{
    public partial class PlayerDashboard : Form
    {
        string userId;
        string connStr = DB.connStr;

        public PlayerDashboard(string uid)
        {
            InitializeComponent();
            userId = uid;
        }

        private void PlayerDashboard_Load(object sender, EventArgs e)
        {
            this.WindowState = FormWindowState.Maximized;
            ApplyThemeToAllGrids();
            LoadAllData();
        }

        private void ApplyThemeToAllGrids()
        {
            DataGridView[] grids = {
                dataGridViewAvailable, dataGridViewPurchased, dataGridViewTransactions,
                dataGridViewStats, dataGridViewHistory, dataGridViewRequests, dataGridViewFriends
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

        void LoadAllData()
        {
            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                conn.Open();

                // USER INFO
                MySqlCommand cmd1 = new MySqlCommand("SELECT username, email FROM users WHERE user_id=@id", conn);
                cmd1.Parameters.AddWithValue("@id", userId);
                MySqlDataReader reader = cmd1.ExecuteReader();

                if (reader.Read())
                {
                    label2.Text = "Welcome, " + reader["username"].ToString();
                    label3.Text = "Email: " + reader["email"].ToString();
                }
                reader.Close();

                // BALANCE
                MySqlCommand cmd2 = new MySqlCommand("SELECT balance FROM wallet WHERE user_id=@id", conn);
                cmd2.Parameters.AddWithValue("@id", userId);
                object balance = cmd2.ExecuteScalar();
                label4.Text = "Balance: ₹ " + (balance == null ? "0" : balance.ToString());

                // AVAILABLE GAMES — uses VIEW: vw_game_catalog
                DataTable dt = new DataTable();
                new MySqlDataAdapter("SELECT game_id, title, genre, price, release_date, developer_studio FROM vw_game_catalog", conn).Fill(dt);
                dataGridViewAvailable.DataSource = dt;
                dataGridViewAvailable.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.AllCells;

                // PURCHASED (game_id visible)
                DataTable dt2 = new DataTable();
                MySqlDataAdapter da2 = new MySqlDataAdapter(
                    "SELECT g.game_id, g.title, g.genre, g.price, g.release_date, g.developer_id FROM game g JOIN purchase p ON g.game_id=p.game_id WHERE p.user_id=@id AND g.approval_status='approved'", conn);
                da2.SelectCommand.Parameters.AddWithValue("@id", userId);
                da2.Fill(dt2);
                dataGridViewPurchased.DataSource = dt2;
                dataGridViewPurchased.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.AllCells;

                // HISTORY
                LoadHistory();
            }

            LoadTransactions();
            LoadFriends();
            LoadFriendRequests();
            LoadStats();
        }

        // Ensure the friendship table exists; create it if missing
        private void EnsureFriendshipTableExists(MySqlConnection conn)
        {
            // expects an open connection
            using (var check = new MySqlCommand(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'friendship'", conn))
            {
                int count = Convert.ToInt32(check.ExecuteScalar());
                if (count == 0)
                {
                    string createSql = @"CREATE TABLE friendship (
                        friendship_id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id_1 VARCHAR(50) NOT NULL,
                        user_id_2 VARCHAR(50) NOT NULL,
                        status ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        INDEX idx_user1 (user_id_1),
                        INDEX idx_user2 (user_id_2)
                    ) ENGINE=InnoDB;";

                    using (var createCmd = new MySqlCommand(createSql, conn))
                    {
                        createCmd.ExecuteNonQuery();
                    }
                }
            }
        }

        // 🔥 HISTORY REFRESH — Shows every match session for the player
        void LoadHistory()
        {
            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                conn.Open();

                DataTable dtHistory = new DataTable();
                // Columns: match_id, Game, Score, Result, Started At, Ended At, Status
                MySqlDataAdapter daHistory = new MySqlDataAdapter(
                    @"SELECT m.match_id AS 'Match ID',
                             g.title AS Game,
                             p.score AS Score,
                             p.result AS Result,
                             m.started_at AS 'Started At',
                             m.ended_at AS 'Ended At'
                      FROM participation p
                      JOIN match_session m ON p.match_id = m.match_id
                      JOIN game g ON m.game_id = g.game_id
                      WHERE p.user_id = @id
                      ORDER BY m.started_at DESC", conn);

                daHistory.SelectCommand.Parameters.AddWithValue("@id", userId);
                daHistory.Fill(dtHistory);

                dataGridViewHistory.DataSource = dtHistory;
                dataGridViewHistory.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.AllCells;
            }
        }

        private void LoadTransactions()
        {
            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                conn.Open();
                DataTable dt = new DataTable();
                MySqlDataAdapter da = new MySqlDataAdapter(
                    "SELECT transaction_id, amount AS Amount, transaction_type AS Type, payment_method AS 'Method', reference_id AS 'Ref ID', description AS Description, transaction_status AS Status, created_at AS Date FROM transaction WHERE user_id=@id ORDER BY created_at DESC", conn);
                da.SelectCommand.Parameters.AddWithValue("@id", userId);
                da.Fill(dt);
                dataGridViewTransactions.DataSource = dt;
                if (dataGridViewTransactions.Columns["transaction_id"] != null) dataGridViewTransactions.Columns["transaction_id"].Visible = false;
                dataGridViewTransactions.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.AllCells;
            }
        }

        // 🔥 LOAD STATS — reads directly from player_game_stats table
        // Uses VIEW: vw_leaderboard for stats display
        private void LoadStats()
        {
            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                conn.Open();
                DataTable dt = new DataTable();
                // Uses VIEW vw_leaderboard (JOIN of player_game_stats + users + game)
                MySqlDataAdapter da = new MySqlDataAdapter(
                    @"SELECT game_title AS Game,
                             total_play_time AS PlayTime,
                             xp AS XP,
                             rank_level AS 'Game Rank',
                             best_score AS 'Best Score'
                      FROM vw_leaderboard
                      WHERE user_id = @id", conn);

                da.SelectCommand.Parameters.AddWithValue("@id", userId);
                da.Fill(dt);

                dataGridViewStats.DataSource = dt;
                dataGridViewStats.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.AllCells;
            }
        }

        // 🔥 LOAD FRIENDS — only shows accepted friends of the logged-in player
        private void LoadFriends()
        {
            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                try
                {
                    conn.Open();

                    // ensure the table exists before querying
                    EnsureFriendshipTableExists(conn);

                    DataTable dt = new DataTable();
                    MySqlDataAdapter da = new MySqlDataAdapter(
                        @"SELECT u.user_id AS FriendID, u.username AS FriendName, f.status AS Status
                      FROM friendship f
                      JOIN users u ON u.user_id = CASE
                          WHEN f.user_id_1 = @id THEN f.user_id_2
                          ELSE f.user_id_1
                      END
                      WHERE (f.user_id_1 = @id OR f.user_id_2 = @id)
                        AND f.status IN ('accepted', 'declined')", conn);

                    da.SelectCommand.Parameters.AddWithValue("@id", userId);
                    da.Fill(dt);
                    dataGridViewFriends.DataSource = dt;
                    dataGridViewFriends.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
                }
                catch (MySqlException mex)
                {
                    // log or surface a friendly message; keep UI responsive
                    Console.Error.WriteLine("DB error in LoadFriends: " + mex.Message);
                    dataGridViewFriends.DataSource = new DataTable();
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine("Unexpected error in LoadFriends: " + ex.Message);
                    dataGridViewFriends.DataSource = new DataTable();
                }
            }
        }

        // 🔥 LOAD FRIEND REQUESTS — shows pending requests sent TO the logged-in player
        private void LoadFriendRequests()
        {
            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                try
                {
                    conn.Open();

                    // ensure the table exists before querying
                    EnsureFriendshipTableExists(conn);

                    DataTable dt = new DataTable();
                    MySqlDataAdapter da = new MySqlDataAdapter(
                        @"SELECT f.friendship_id, u.user_id AS SenderID, u.username AS SenderName, f.status AS Status
                      FROM friendship f
                      JOIN users u ON u.user_id = f.user_id_1
                      WHERE f.user_id_2 = @id
                        AND f.status = 'pending'", conn);

                    da.SelectCommand.Parameters.AddWithValue("@id", userId);
                    da.Fill(dt);
                    dataGridViewRequests.DataSource = dt;
                    dataGridViewRequests.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
                }
                catch (MySqlException mex)
                {
                    Console.Error.WriteLine("DB error in LoadFriendRequests: " + mex.Message);
                    dataGridViewRequests.DataSource = new DataTable();
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine("Unexpected error in LoadFriendRequests: " + ex.Message);
                    dataGridViewRequests.DataSource = new DataTable();
                }
            }
        }

        // 🔥 ADD FRIEND — sends a friend request (status = 'pending')
        // User can type either a username (e.g. "player2") or a user_id (e.g. "p_102")
        private void buttonAddFriend_Click_1(object sender, EventArgs e)
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

                // ensure table exists before manipulating it
                EnsureFriendshipTableExists(conn);

                // Try to find the user by username first, then by user_id
                MySqlCommand findUser = new MySqlCommand(
                    "SELECT user_id FROM users WHERE username=@input OR user_id=@input LIMIT 1", conn);
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

                // Check if a friendship already exists (in either direction)
                MySqlCommand checkFriend = new MySqlCommand(
                    @"SELECT COUNT(*) FROM friendship
                      WHERE (user_id_1=@id AND user_id_2=@fid)
                         OR (user_id_1=@fid AND user_id_2=@id)", conn);
                checkFriend.Parameters.AddWithValue("@id", userId);
                checkFriend.Parameters.AddWithValue("@fid", friendId);
                int exists = Convert.ToInt32(checkFriend.ExecuteScalar());

                if (exists > 0)
                {
                    MessageBox.Show("Friend request already exists or you are already friends ❌");
                    return;
                }

                // Insert new friendship with status 'pending'
                MySqlCommand insertCmd = new MySqlCommand(
                    "INSERT INTO friendship(user_id_1, user_id_2, status) VALUES(@id, @fid, 'pending')", conn);
                insertCmd.Parameters.AddWithValue("@id", userId);
                insertCmd.Parameters.AddWithValue("@fid", friendId);
                insertCmd.ExecuteNonQuery();

                MessageBox.Show("Friend Request Sent ✅");
                textBoxFriend.Text = "";
            }

            LoadFriends();
            LoadFriendRequests();
        }

        // ACCEPT FRIEND REQUEST
        private void buttonAccept_Click(object sender, EventArgs e)
        {
            if (dataGridViewRequests.CurrentRow == null)
            {
                MessageBox.Show("Select a request first");
                return;
            }

            int friendshipId = Convert.ToInt32(dataGridViewRequests.CurrentRow.Cells["friendship_id"].Value);

            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                conn.Open();

                EnsureFriendshipTableExists(conn);

                MySqlCommand cmd = new MySqlCommand(
                    "UPDATE friendship SET status='accepted' WHERE friendship_id=@fid", conn);
                cmd.Parameters.AddWithValue("@fid", friendshipId);
                cmd.ExecuteNonQuery();

                MessageBox.Show("Friend Request Accepted ✅");
            }

            LoadFriends();
            LoadFriendRequests();
        }

        // 🔥 REJECT FRIEND REQUEST
        private void buttonReject_Click(object sender, EventArgs e)
        {
            if (dataGridViewRequests.CurrentRow == null)
            {
                MessageBox.Show("Select a request first");
                return;
            }

            int friendshipId = Convert.ToInt32(dataGridViewRequests.CurrentRow.Cells["friendship_id"].Value);

            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                conn.Open();

                EnsureFriendshipTableExists(conn);

                MySqlCommand cmd = new MySqlCommand(
                    "UPDATE friendship SET status='declined' WHERE friendship_id=@fid", conn);
                cmd.Parameters.AddWithValue("@fid", friendshipId);
                cmd.ExecuteNonQuery();

                MessageBox.Show("Friend Request Declined ❌");
            }

            LoadFriends();
            LoadFriendRequests();
        }

        // 🔥 PLAY BUTTON (FINAL)
        private void btnPlayGame_Click(object sender, EventArgs e)
        {
            if (dataGridViewPurchased.CurrentRow == null)
            {
                MessageBox.Show("Select a game first");
                return;
            }

            string gameName = dataGridViewPurchased.CurrentRow.Cells["title"].Value.ToString().ToLower();
            int gameId = Convert.ToInt32(dataGridViewPurchased.CurrentRow.Cells["game_id"].Value);

            if (gameName.Contains("pong") || gameName.Contains("ping") || gameName.Contains("game c"))
            {
                new PongGame(userId, gameId).ShowDialog();
            }
            else if (gameName.Contains("fakegame 1") || gameName.Contains("fakegame1") || gameName.Contains("game a"))
            {
                new FakeGame1(userId, gameId).ShowDialog();
            }
            else if (gameName.Contains("fakegame 2") || gameName.Contains("fakegame2") || gameName.Contains("game b"))
            {
                new FakeGame2(userId, gameId).ShowDialog();
            }
            else
            {
                MessageBox.Show("Game not implemented yet.\nSimulating a quick play (+1 Playtime, +10 XP)...", "Simulation", MessageBoxButtons.OK, MessageBoxIcon.Information);
                
                using (MySqlConnection conn = new MySqlConnection(connStr))
                {
                    conn.Open();
                    
                    // 1. Create Match Session
                    MySqlCommand cmdMatch = new MySqlCommand(
                        "INSERT INTO match_session(game_id, started_at, ended_at, duration, match_status) " +
                        "VALUES(@gid, NOW(), NOW(), 10, 'completed'); SELECT LAST_INSERT_ID();", conn);
                    cmdMatch.Parameters.AddWithValue("@gid", gameId);
                    long matchId = Convert.ToInt64(cmdMatch.ExecuteScalar());

                    // 2. Add Participation
                    MySqlCommand cmdPart = new MySqlCommand(
                        "INSERT INTO participation(match_id, user_id, score, result) " +
                        "VALUES(@mid, @uid, 0, 'loss')", conn);
                    cmdPart.Parameters.AddWithValue("@mid", matchId);
                    cmdPart.Parameters.AddWithValue("@uid", userId);
                    cmdPart.ExecuteNonQuery();

                    // 3. Update player_game_stats
                    MySqlCommand checkStats = new MySqlCommand("SELECT COUNT(*) FROM player_game_stats WHERE user_id=@uid AND game_id=@gid", conn);
                    checkStats.Parameters.AddWithValue("@uid", userId);
                    checkStats.Parameters.AddWithValue("@gid", gameId);
                    int hasStats = Convert.ToInt32(checkStats.ExecuteScalar());

                    if (hasStats > 0)
                    {
                        MySqlCommand cmdStats = new MySqlCommand(
                            "UPDATE player_game_stats SET total_play_time = total_play_time + 1, " +
                            "experience = experience + 10 " +
                            "WHERE user_id=@uid AND game_id=@gid", conn);
                        cmdStats.Parameters.AddWithValue("@uid", userId);
                        cmdStats.Parameters.AddWithValue("@gid", gameId);
                        cmdStats.ExecuteNonQuery();
                    }
                    else
                    {
                        MySqlCommand cmdStats = new MySqlCommand(
                            "INSERT INTO player_game_stats(user_id, game_id, total_play_time, experience, rank_level, best_score) " +
                            "VALUES(@uid, @gid, 1, 10, 1, 0)", conn);
                        cmdStats.Parameters.AddWithValue("@uid", userId);
                        cmdStats.Parameters.AddWithValue("@gid", gameId);
                        cmdStats.ExecuteNonQuery();
                    }
                    
                    // 4. Recalculate Rankings using STORED PROCEDURE
                    MySqlCommand cmdRank = new MySqlCommand("CALL sp_recalculate_ranks(@gid)", conn);
                    cmdRank.Parameters.AddWithValue("@gid", gameId);
                    cmdRank.ExecuteNonQuery();
                }
            }

            LoadHistory(); // 🔥 refresh after game
            LoadStats();
        }

        // 🔥 BUY BUTTON (FINAL)
        private void buybutton_Click(object sender, EventArgs e)
        {
            if (dataGridViewAvailable.CurrentRow == null)
            {
                MessageBox.Show("Select a game to buy");
                return;
            }

            int gameId = Convert.ToInt32(dataGridViewAvailable.CurrentRow.Cells["game_id"].Value);
            decimal price = Convert.ToDecimal(dataGridViewAvailable.CurrentRow.Cells["price"].Value);
            string gameTitle = dataGridViewAvailable.CurrentRow.Cells["title"]?.Value?.ToString() ?? "Unknown Game";

            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                conn.Open();

                // CHECK IF ALREADY PURCHASED
                MySqlCommand checkPurchased = new MySqlCommand("SELECT COUNT(*) FROM purchase WHERE user_id=@uid AND game_id=@gid", conn);
                checkPurchased.Parameters.AddWithValue("@uid", userId);
                checkPurchased.Parameters.AddWithValue("@gid", gameId);
                int alreadyPurchased = Convert.ToInt32(checkPurchased.ExecuteScalar());

                if (alreadyPurchased > 0)
                {
                    MessageBox.Show("Game is already purchased! 🎮", "Already Owned", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    return;
                }

                // CHECK BALANCE
                MySqlCommand checkCmd = new MySqlCommand("SELECT balance FROM wallet WHERE user_id=@id", conn);
                checkCmd.Parameters.AddWithValue("@id", userId);
                decimal balance = Convert.ToDecimal(checkCmd.ExecuteScalar());

                if (balance < price)
                {
                    MessageBox.Show("Insufficient balance ❌");
                    return;
                }

                MySqlTransaction trans = conn.BeginTransaction();
                try
                {
                    // DEDUCT MONEY
                    new MySqlCommand("UPDATE wallet SET balance = balance - @amt WHERE user_id=@id", conn, trans)
                    {
                        Parameters = {
                            new MySqlParameter("@amt", price),
                            new MySqlParameter("@id", userId)
                        }
                    }.ExecuteNonQuery();

                    // INSERT PURCHASE
                    new MySqlCommand(
                        "INSERT INTO purchase(user_id, game_id, price, purchase_date) VALUES(@uid,@gid,@price,NOW())", conn, trans)
                    {
                        Parameters = {
                            new MySqlParameter("@uid", userId),
                            new MySqlParameter("@gid", gameId),
                            new MySqlParameter("@price", price)
                        }
                    }.ExecuteNonQuery();

                    // LOG TRANSACTION
                    string refId = "GAME-" + DateTime.Now.Ticks.ToString().Substring(8);
                    new MySqlCommand(
                        "INSERT INTO transaction(user_id, amount, transaction_type, description, reference_id, payment_method, transaction_status) VALUES(@uid2, @amt2, 'purchase', @desc, @ref, 'Gameverse Wallet', 'completed')", conn, trans)
                    {
                        Parameters = {
                            new MySqlParameter("@uid2", userId),
                            new MySqlParameter("@amt2", price),
                            new MySqlParameter("@desc", "Purchased: " + gameTitle),
                            new MySqlParameter("@ref", refId)
                        }
                    }.ExecuteNonQuery();

                    // COMMIT TRANSACTION
                    trans.Commit();
                    MessageBox.Show("Game Purchased ✅");
                }
                catch (Exception ex)
                {
                    trans.Rollback();
                    MessageBox.Show("Purchase failed! Transaction rolled back. Error: " + ex.Message);
                }
            }

            LoadAllData(); // 🔥 refresh everything
        }

        private async void buttonAddMoney_Click(object sender, EventArgs e)
        {
            if (string.IsNullOrWhiteSpace(textBoxAmount.Text)) return;
            if (!decimal.TryParse(textBoxAmount.Text, out decimal amount) || amount <= 0) return;

            long newTransactionId = 0;

            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                conn.Open();

                // 1. LOG TRANSACTION AS PENDING
                string refId = "BANK-" + DateTime.Now.Ticks.ToString().Substring(8);
                MySqlCommand cmd = new MySqlCommand(
                    "INSERT INTO transaction(user_id, amount, transaction_type, description, reference_id, payment_method, transaction_status) VALUES(@uid, @amt, 'deposit', 'Wallet top-up', @ref, 'Bank Transfer', 'pending'); SELECT LAST_INSERT_ID();", conn);
                cmd.Parameters.AddWithValue("@uid", userId);
                cmd.Parameters.AddWithValue("@amt", amount);
                cmd.Parameters.AddWithValue("@ref", refId);
                newTransactionId = Convert.ToInt64(cmd.ExecuteScalar());
            }

            // Refresh just the transactions list so user sees "pending"
            LoadTransactions();

            // Disable button to prevent spamming
            buttonAddMoney.Enabled = false;
            buttonAddMoney.Text = "Processing...";

            MessageBox.Show("Payment Initiated.\n\nWaiting for bank server confirmation...\n(Simulating a 5-second server delay for Viva demonstration)", "Bank Processing", MessageBoxButtons.OK, MessageBoxIcon.Information);

            // ⏳ SIMULATE SERVER DELAY
            await Task.Delay(5000);

            // 2. SERVER CONFIRMS: UPDATE TO COMPLETED & ADD MONEY
            using (MySqlConnection conn = new MySqlConnection(connStr))
            {
                conn.Open();

                // Update Transaction Status
                new MySqlCommand($"UPDATE transaction SET transaction_status='completed' WHERE transaction_id={newTransactionId}", conn).ExecuteNonQuery();

                // Update Wallet
                MySqlCommand cmdWallet = new MySqlCommand("UPDATE wallet SET balance = balance + @amt WHERE user_id=@id", conn);
                cmdWallet.Parameters.AddWithValue("@amt", amount);
                cmdWallet.Parameters.AddWithValue("@id", userId);
                cmdWallet.ExecuteNonQuery();
            }

            buttonAddMoney.Enabled = true;
            buttonAddMoney.Text = "Add Money";
            textBoxAmount.Text = "";

            MessageBox.Show($"Payment Successful! ₹{amount} has been added to your wallet. ✅", "Transaction Complete", MessageBoxButtons.OK, MessageBoxIcon.Information);

            // Refresh everything (wallet balance + transaction status)
            LoadAllData();
        }
        private void dataGridView1_CellContentClick(object sender, DataGridViewCellEventArgs e) { }

        private void label4_Click(object sender, EventArgs e) { }

        private void label7_Click(object sender, EventArgs e) { }

        private void textBoxAmount_TextChanged(object sender, EventArgs e) { }

        private void lblInfo_Click(object sender, EventArgs e) { }
        private void textBoxFriend_TextChanged(object sender, EventArgs e) { }

        // 🔥 INDIVIDUAL REFRESH BUTTONS
        private void buttonRefreshStats_Click(object sender, EventArgs e)
        {
            LoadStats();
            MessageBox.Show("Refreshed! ✅", "Stats", MessageBoxButtons.OK, MessageBoxIcon.None);
        }

        private void buttonRefreshAvailable_Click(object sender, EventArgs e)
        {
            LoadAllData();
            MessageBox.Show("Refreshed! ✅", "Games", MessageBoxButtons.OK, MessageBoxIcon.None);
        }

        private void buttonRefreshPurchased_Click(object sender, EventArgs e)
        {
            LoadAllData();
            MessageBox.Show("Refreshed! ✅", "My Games", MessageBoxButtons.OK, MessageBoxIcon.None);
        }

        private void buttonRefreshTransactions_Click(object sender, EventArgs e)
        {
            LoadTransactions();
            MessageBox.Show("Refreshed! ✅", "Wallet", MessageBoxButtons.OK, MessageBoxIcon.None);
        }

        private void buttonRefreshHistory_Click(object sender, EventArgs e)
        {
            LoadHistory();
            MessageBox.Show("Refreshed! ✅", "History", MessageBoxButtons.OK, MessageBoxIcon.None);
        }

        private void buttonRefreshSocial_Click(object sender, EventArgs e)
        {
            LoadFriends();
            LoadFriendRequests();
            MessageBox.Show("Refreshed! ✅", "Social", MessageBoxButtons.OK, MessageBoxIcon.None);
        }

        private void btnPlayGame_Click_1(object sender, EventArgs e)
        {
            btnPlayGame_Click(sender, e);
        }

        private void dataGridViewPurchased_CellContentClick(object sender, DataGridViewCellEventArgs e)
        {

        }

        private void btnLogout_Click(object sender, EventArgs e)
        {
            new Form1().Show();
            this.Close();
        }
    }
}