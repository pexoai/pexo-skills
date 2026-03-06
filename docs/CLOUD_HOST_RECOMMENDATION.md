# Cloud Host Recommendations (for Running OpenClaw Gateway)

For OpenClaw gateway + Telegram, etc.: **1 vCPU, 1GB RAM** is enough; traffic and CPU usage are light. Recommendations by scenario below.

---

## Recommendation 1: Users in China, budget-friendly and stable

| Provider | Product | Config example | Price | Notes |
|------|------|----------|------|------|
| **Volcengine** | Cloud Server ECS | Pay-as-you-go / yearly, multiple specs | Pay-as-you-go | ByteDance cloud, clear console, multiple regions in China |
| **Tencent Cloud** | Lighthouse | 1 vCPU 2G / 30G SSD / 30M bandwidth | ¥24–35/mo | Hong Kong/Singapore nodes, no ICP required, Chinese console, low latency from mainland |
| **Alibaba Cloud** | Lightweight Server (International) | 2 vCPU 0.5G+ / 200M peak bandwidth | ¥28/mo+ | Hong Kong, etc., no ICP required; alternative to Tencent |

- Purchase: [Volcengine ECS](https://www.volcengine.com/product/ecs) / [Tencent Cloud Lighthouse](https://cloud.tencent.com/product/lighthouse) / [Alibaba Cloud Lightweight](https://www.aliyun.com/product/swas)
- Choose **Hong Kong** or **Singapore** datacenter; better connectivity to Telegram and overseas APIs.
- Select **Ubuntu 22.04 LTS** as the OS.

---

## Recommendation 2: International providers, pay-as-you-go

| Provider | Config | Price | Notes |
|------|------|------|------|
| **Vultr** | 1 vCPU 1G / 25G SSD | $5–6/mo | Singapore/Tokyo/US West, hourly billing, delete anytime |
| **Linode (Akamai)** | 1 vCPU 1G / 1TB egress | $5/mo | Singapore, etc., cheap traffic, stable |
| **DigitalOcean** | 1 vCPU 1G / 25G SSD | $6/mo | Singapore/Bangalore, good docs and ecosystem |

- Vultr: https://www.vultr.com  
- Linode: https://www.linode.com  
- Choose **Ubuntu 22.04**; **Singapore** or **Tokyo** datacenter usually gives better latency.

---

## Recommendation 3: Very low budget, trial first

- **CloudCone**, **Hostwinds**, etc. have $2.5–3.5/mo tiers; datacenters are often in the US West, so latency from China may be higher; suitable for getting things running before switching.
- Acceptable if mainly for overseas users or when accessing via a proxy.

---

## General Configuration Tips

- **Specs**: 1 vCPU, 1GB RAM minimum; if running other services too, consider 1 vCPU 2GB.
- **OS**: Ubuntu 22.04 LTS.
- **Region**:  
  - In China and want low latency → Tencent Cloud/Alibaba Cloud **Hong Kong**.  
  - Want stable Telegram and overseas APIs → **Hong Kong** or **Singapore** (both work for domestic and international providers).
- **Security**: Only open ports 22 (SSH) and 80/443 if needed; store secrets in env vars, not in code or Git.

---

## Summary

- **China + hassle-free**: Volcengine / Tencent Cloud / Alibaba Cloud; pay-as-you-go or monthly; Hong Kong/Singapore for better overseas service access.  
- **International + flexible**: Vultr or Linode; Singapore/Tokyo; $5–6/mo.  
- After provisioning, install the OpenClaw gateway on the server, configure `.env` and Telegram token, and stop the local gateway.
