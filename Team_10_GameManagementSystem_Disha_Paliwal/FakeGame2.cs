using System;
using System.Windows.Forms;
using MySql.Data.MySqlClient;

namespace GameManagementSystem
{
    public partial class FakeGame2 : Form
    {
        string userId;
        int gameId;
        
        public FakeGame2()
        {
            InitializeComponent();
        }

        public FakeGame2(string uid, int gid)
        {
            InitializeComponent();
            userId = uid;
            gameId = gid;
        }

        int c = 0;
        int elapsedSeconds = 0;

        private void GameTimer_Tick(object sender, EventArgs e)
        {
            c++;
            elapsedSeconds++;
            lblTime.Text = c.ToString();
        }

        private void btnStart_Click(object sender, EventArgs e)
        {
            if (gameTimer.Enabled)
            {
                gameTimer.Enabled = false;
                btnStart.Text = "Resume";
            }
            else
            {
                gameTimer.Enabled = true;
                btnStart.Text = "Pause";
            }
        }

        private void btnStop_Click(object sender, EventArgs e)
        {
            gameTimer.Enabled = false;

            if (!string.IsNullOrEmpty(userId))
            {
                string result = (c >= 10) ? "win" : "loss";
                int duration = (elapsedSeconds > 0) ? elapsedSeconds : 1;
                SaveScoreToDatabase(this.gameId, c, duration, result); 
                MessageBox.Show($"Game Over! Score: {c} | Result: {result.ToUpper()} ✅");
                userId = null; // Mark as saved
            }

            btnStart.Text = "Start";
            c = 0;
            elapsedSeconds = 0;
            lblTime.Text = "0";
            btnStop.Text = "Stop";
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            if (!string.IsNullOrEmpty(userId))
            {
                string result = (c >= 10) ? "win" : "loss";
                int duration = (elapsedSeconds > 0) ? elapsedSeconds : 1;
                SaveScoreToDatabase(this.gameId, c, duration, result);
            }
            base.OnFormClosing(e);
        }

        private void SaveScoreToDatabase(int gameId, int score, int duration, string result)
        {
            string connStr = DB.connStr;
            try
            {
                using (MySqlConnection conn = new MySqlConnection(connStr))
                {
                    conn.Open();
                    
                    // 1. Create Match Session
                    MySqlCommand cmdMatch = new MySqlCommand(
                        "INSERT INTO match_session(game_id, started_at, ended_at, duration, match_status) " +
                        "VALUES(@gid, DATE_SUB(NOW(), INTERVAL @dur SECOND), NOW(), @dur, 'completed'); " +
                        "SELECT LAST_INSERT_ID();", conn);
                    cmdMatch.Parameters.AddWithValue("@gid", gameId);
                    cmdMatch.Parameters.AddWithValue("@dur", duration);
                    
                    int matchId = Convert.ToInt32(cmdMatch.ExecuteScalar());

                    // 2. Add Participation
                    MySqlCommand cmdPart = new MySqlCommand(
                        "INSERT INTO participation(match_id, user_id, score, result) " +
                        "VALUES(@mid, @uid, @score, @res)", conn);
                    cmdPart.Parameters.AddWithValue("@mid", matchId);
                    cmdPart.Parameters.AddWithValue("@uid", userId);
                    cmdPart.Parameters.AddWithValue("@score", score);
                    cmdPart.Parameters.AddWithValue("@res", result);
                    cmdPart.ExecuteNonQuery();

                    // 3. Update player_game_stats (with best_score)
                    MySqlCommand checkStats = new MySqlCommand("SELECT COUNT(*) FROM player_game_stats WHERE user_id=@uid AND game_id=@gid", conn);
                    checkStats.Parameters.AddWithValue("@uid", userId);
                    checkStats.Parameters.AddWithValue("@gid", gameId);
                    int hasStats = Convert.ToInt32(checkStats.ExecuteScalar());

                    int xpEarned = (result == "win") ? 50 : 10;

                    if (hasStats > 0)
                    {
                        MySqlCommand cmdStats = new MySqlCommand(
                            "UPDATE player_game_stats SET total_play_time = total_play_time + 1, " +
                            "experience = experience + @xp, " +
                            "best_score = GREATEST(best_score, @score) " +
                            "WHERE user_id=@uid AND game_id=@gid", conn);
                        cmdStats.Parameters.AddWithValue("@uid", userId);
                        cmdStats.Parameters.AddWithValue("@gid", gameId);
                        cmdStats.Parameters.AddWithValue("@xp", xpEarned);
                        cmdStats.Parameters.AddWithValue("@score", score);
                        cmdStats.ExecuteNonQuery();
                    }
                    else
                    {
                        MySqlCommand cmdStats = new MySqlCommand(
                            "INSERT INTO player_game_stats(user_id, game_id, total_play_time, experience, rank_level, best_score) " +
                            "VALUES(@uid, @gid, 1, @xp, 1, @score)", conn);
                        cmdStats.Parameters.AddWithValue("@uid", userId);
                        cmdStats.Parameters.AddWithValue("@gid", gameId);
                        cmdStats.Parameters.AddWithValue("@xp", xpEarned);
                        cmdStats.Parameters.AddWithValue("@score", score);
                        cmdStats.ExecuteNonQuery();
                    }

                    // 4. Recalculate rank_level for ALL players of this game
                    MySqlCommand cmdRank = new MySqlCommand(
                        "UPDATE player_game_stats pgs SET rank_level = " +
                        "(SELECT COUNT(*) + 1 FROM (SELECT user_id, game_id, best_score FROM player_game_stats) AS t " +
                        "WHERE t.game_id = pgs.game_id AND t.best_score > pgs.best_score) " +
                        "WHERE pgs.game_id = @gid", conn);
                    cmdRank.Parameters.AddWithValue("@gid", gameId);
                    cmdRank.ExecuteNonQuery();
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error saving score: " + ex.Message);
            }
        }



        private void FakeGame2_Load(object sender, EventArgs e)
        {
            btnStart.Text = "Start";
            lblTime.Text = "0";

        }
        private void lblInfo_Click(object sender, EventArgs e)
        {
        }
    }
}