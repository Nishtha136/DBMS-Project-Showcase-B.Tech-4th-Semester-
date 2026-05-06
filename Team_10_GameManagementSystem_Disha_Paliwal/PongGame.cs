using System;
using System.Drawing;
using System.Windows.Forms;
using MySql.Data.MySqlClient;

namespace GameManagementSystem
{
    public partial class PongGame : Form
    {
        int ballXspeed = 3;
        int ballYspeed = 3;
        int speed = 3;
        Random rand = new Random();

        bool goDown, goUp;
        int computer_speed_change = 0;

        int playerScore = 0;
        int computerScore = 0;
        int playerSpeed = 8;

        int[] i = { 4, 5, 6 };
        int[] j = { 5, 6, 7, 8 };

        int ballX = 300;
        int ballY = 200;
        int ballSize = 18;

        bool playerHit = false;
        bool computerHit = false;
        string userId;
        int gameId;

        public PongGame()
        {
            InitializeComponent();

            this.DoubleBuffered = true;
            this.KeyPreview = true; // ✅ FIX: keyboard works

            GameTimer.Start(); // ✅ ensure timer runs
        }

        public PongGame(string uid, int gid)
        {
            InitializeComponent();
            userId = uid;
            gameId = gid;

            this.DoubleBuffered = true;
            this.KeyPreview = true; 

            GameTimer.Start(); 
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            e.Graphics.FillEllipse(Brushes.White, ballX, ballY, ballSize, ballSize);
        }

        private void GameTimerEvent(object sender, EventArgs e)
        {
            ballY += ballYspeed;
            ballX += ballXspeed;

            this.Text = "Player: " + playerScore + "  |  Computer: " + computerScore;

            // WALL COLLISION
            if (ballY <= 0 || ballY + ballSize >= this.ClientSize.Height)
            {
                ballYspeed = -ballYspeed;
            }

            if (ballX <= 0)
            {
                computerScore++;
                ResetBall();
            }

            if (ballX + ballSize >= this.ClientSize.Width)
            {
                playerScore++;
                ResetBall();
            }

            // PLAYER MOVE
            if (goDown && player.Bottom < this.ClientSize.Height)
                player.Top += playerSpeed;

            if (goUp && player.Top > 0)
                player.Top -= playerSpeed;

            // COMPUTER AI
            if (ballY < computer.Top + computer.Height / 2)
                computer.Top -= speed;
            else
                computer.Top += speed;

            if (computer.Top < 0) computer.Top = 0;
            if (computer.Bottom > this.ClientSize.Height)
                computer.Top = this.ClientSize.Height - computer.Height;

            // RANDOM AI SPEED
            computer_speed_change--;
            if (computer_speed_change < 0)
            {
                speed = i[rand.Next(i.Length)];
                computer_speed_change = 50;
            }

            Rectangle ballRect = new Rectangle(ballX, ballY, ballSize, ballSize);

            // PLAYER COLLISION
            Rectangle playerZone = player.Bounds;
            playerZone.Inflate(15, 15);

            if (ballRect.IntersectsWith(playerZone))
            {
                if (!playerHit)
                {
                    ballX = player.Right;

                    int x = j[rand.Next(j.Length)];
                    int y = j[rand.Next(j.Length)];

                    ballXspeed = Math.Abs(x);
                    ballYspeed = (ballYspeed < 0) ? -y : y;

                    playerHit = true;
                }
            }
            else playerHit = false;

            // COMPUTER COLLISION
            Rectangle computerZone = computer.Bounds;
            computerZone.Inflate(15, 15);

            if (ballRect.IntersectsWith(computerZone))
            {
                if (!computerHit)
                {
                    ballX = computer.Left - ballSize;

                    int x = j[rand.Next(j.Length)];
                    int y = j[rand.Next(j.Length)];

                    ballXspeed = -Math.Abs(x);
                    ballYspeed = (ballYspeed < 0) ? -y : y;

                    computerHit = true;
                }
            }
            else computerHit = false;

            // GAME OVER
            if (computerScore >= 1)
            {
                GameOver("You Lost 😢");
                return;
            }
            if (playerScore >= 1)
            {
                GameOver("You Won 🎉");
                return;
            }

            this.Invalidate();
        }

        void ResetBall()
        {
            ballX = this.ClientSize.Width / 2;
            ballY = this.ClientSize.Height / 2;

            ballXspeed = (rand.Next(0, 2) == 0) ? 3 : -3;
            ballYspeed = (rand.Next(0, 2) == 0) ? 3 : -3;
        }

        private void KeyIsDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Down) goDown = true;
            if (e.KeyCode == Keys.Up) goUp = true;
        }

        private void KeyIsUp(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Down) goDown = false;
            if (e.KeyCode == Keys.Up) goUp = false;
        }

        private void GameOver(string msg)
        {
            GameTimer.Stop();

            if (!string.IsNullOrEmpty(userId))
            {
                string result = (playerScore > computerScore) ? "win" : "loss";
                SaveScoreToDatabase(gameId, playerScore, result); 
                MessageBox.Show($"{msg}\n\nMatch saved to your profile! ✅");
            }
            else
            {
                MessageBox.Show(msg);
            }

            playerScore = 0;
            computerScore = 0;
            userId = null; // Mark as saved
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            if (!string.IsNullOrEmpty(userId))
            {
                // Game was interrupted, save what we have
                string result = (playerScore > computerScore) ? "win" : "loss";
                SaveScoreToDatabase(gameId, playerScore, result);
            }
            base.OnFormClosing(e);
        }

        private void SaveScoreToDatabase(int gameId, int score, string result)
        {
            string connStr = DB.connStr;
            try
            {
                using (MySqlConnection conn = new MySqlConnection(connStr))
                {
                    conn.Open();
                    
                    int duration = 30; // Fixed duration for quick pong matches

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

                    // 4. Recalculate rank_level using STORED PROCEDURE: sp_recalculate_ranks
                    MySqlCommand cmdRank = new MySqlCommand("CALL sp_recalculate_ranks(@gid)", conn);
                    cmdRank.Parameters.AddWithValue("@gid", gameId);
                    cmdRank.ExecuteNonQuery();
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error saving score: " + ex.Message);
            }
        }


    }
}