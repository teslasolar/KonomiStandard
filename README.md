# KonomiStandard

Automated polling repository with scheduled updates every 30 minutes using GitHub Actions (100% free).

## 🚀 Features

- **Automated Polling**: Runs every 30 minutes via GitHub Actions
- **Zero Cost**: Uses GitHub's free tier (2,000 minutes/month for private repos, unlimited for public)
- **Manual Trigger**: Can be triggered manually from GitHub Actions UI
- **Auto-commit**: Automatically commits and pushes changes
- **Extensible**: Easy to customize for your specific polling needs

## 📁 Repository Structure

```
.
├── .github/workflows/
│   └── scheduled-poll.yml    # GitHub Actions workflow
├── scripts/
│   └── poll.py              # Main polling script
├── data/                    # Generated data files (auto-created)
├── requirements.txt         # Python dependencies
└── README.md
```

## ⚙️ Setup

### 1. Enable GitHub Actions

1. Go to your repository settings
2. Navigate to **Actions** → **General**
3. Ensure "Allow all actions and reusable workflows" is enabled
4. Save changes

### 2. Grant Workflow Permissions

1. Go to **Settings** → **Actions** → **General**
2. Scroll to "Workflow permissions"
3. Select "Read and write permissions"
4. Check "Allow GitHub Actions to create and approve pull requests"
5. Save changes

### 3. Customize the Polling Script

Edit [`scripts/poll.py`](scripts/poll.py) to add your custom logic:

```python
def poll_data():
    # Add your polling logic here
    # Examples:
    # - Fetch data from APIs
    # - Check RSS feeds
    # - Monitor websites
    # - Collect metrics
    pass
```

### 4. Add Dependencies (if needed)

Update [`requirements.txt`](requirements.txt) with any Python packages you need:

```txt
requests>=2.31.0
pandas>=2.0.0
beautifulsoup4>=4.12.0
```

### 5. Configure Secrets (optional)

For API keys or sensitive data:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click "New repository secret"
3. Add your secrets
4. Reference them in the workflow using `${{ secrets.YOUR_SECRET_NAME }}`

## 🔄 Polling Schedule

The workflow runs every 30 minutes using a cron schedule:
```yaml
schedule:
  - cron: '*/30 * * * *'
```

### Adjust Polling Frequency

Edit [`.github/workflows/scheduled-poll.yml`](.github/workflows/scheduled-poll.yml):

- Every 15 minutes: `*/15 * * * *`
- Every hour: `0 * * * *`
- Every 6 hours: `0 */6 * * *`
- Daily at midnight: `0 0 * * *`

**Note**: GitHub Actions has a ~3-5 minute delay for scheduled workflows.

## 🧪 Manual Testing

Test the workflow manually:

1. Go to **Actions** tab in GitHub
2. Select "Scheduled Poll" workflow
3. Click "Run workflow" button
4. Monitor the execution

Or test locally:
```bash
python scripts/poll.py
```

## 💰 Cost Analysis

### GitHub Actions (Free Tier)
- **Public repos**: Unlimited minutes ✅
- **Private repos**: 2,000 minutes/month
- **Usage**: ~1 minute per run = 1,440 minutes/month (30-min intervals)

**Verdict**: ✅ **FREE** for public repos, fits within free tier for private repos!

### Alternative Free Options

If you need more than 2,000 minutes/month:

1. **GitHub Pages + Cloudflare Workers** (unlimited)
2. **Vercel Cron Jobs** (100,000 invocations/day)
3. **Railway Cron** (500 hours/month free)
4. **Render Cron Jobs** (750 hours/month free)

## 📊 Monitoring

View workflow runs:
- **Actions tab**: See all execution history
- **Commit history**: Auto-commits show when updates occurred
- **Workflow badges**: Add status badge to README

### Add Status Badge

```markdown
![Scheduled Poll](https://github.com/teslasolar/KonomiStandard/actions/workflows/scheduled-poll.yml/badge.svg)
```

## 🛠️ Troubleshooting

### Workflow not running?
- Check if Actions are enabled in repository settings
- Verify workflow permissions (read + write)
- Ensure cron syntax is correct

### No commits being created?
- Check if the polling script generates file changes
- Review workflow logs in Actions tab
- Verify git config is correct

### Rate limits?
- Add delays between API calls
- Use GitHub's `GITHUB_TOKEN` for GitHub API calls
- Cache data when possible

## 📝 License

MIT License - Feel free to use and modify!
