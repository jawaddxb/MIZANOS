"""Seed Product Hunt launch checklist template (56 items, 7 phases)
and GTM knowledge base entries (10 playbook articles).

Usage:
    python -m apps.api.scripts.seed_ph_checklist
    python -m apps.api.scripts.seed_ph_checklist --force   # re-seed knowledge entries
"""

import argparse
import asyncio

from sqlalchemy import delete, select

from apps.api.models.knowledge import KnowledgeEntry
from apps.api.models.marketing import MarketingChecklistTemplate
from apps.api.models.user import Profile
from apps.api.scripts.ph_knowledge_entries import PH_KNOWLEDGE_ENTRIES
from packages.common.db.session import async_session_factory

SOURCE_TYPE = "product_hunt"
ADMIN_EMAIL = "jawad@vanarchain.com"
KNOWLEDGE_CATEGORY = "gtm"

# fmt: off
TEMPLATE_ITEMS: list[tuple[str, str, str]] = [
    # ── Phase 1: Foundation (4+ weeks before) ──
    ("PH: 1. Foundation", "Define single-sentence value proposition",
     'One measurable sentence: "X helps Y do Z in N% less time" — this drives all PH copy'),
    ("PH: 1. Foundation", "Identify 3-4 target personas",
     "Map specific job profiles who will find the product on PH and understand it instantly"),
    ("PH: 1. Foundation", "Set SMART launch goals",
     "Define success: target upvotes (300-900 for top 6), email signups, trial activations"),
    ("PH: 1. Foundation", "Create PH-specific landing page",
     "Dedicated page for PH traffic with clear CTA, social proof, and special offer"),
    ("PH: 1. Foundation", "Set up analytics tracking",
     "UTM params for PH traffic, conversion tracking, signup funnels — know your numbers"),
    ("PH: 1. Foundation", "Research competitor PH launches",
     "Study 5-10 similar product launches: what worked, what taglines, what visuals"),

    # ── Phase 2: Community & Audience (3-4 weeks before) ──
    ("PH: 2. Community", "Create/optimize PH maker profiles",
     "Complete bios, photos, website links for all team members who will be listed as makers"),
    ("PH: 2. Community", "Start engaging on Product Hunt",
     "Upvote, comment thoughtfully on other launches daily — build authentic presence for 2-3 weeks minimum"),
    ("PH: 2. Community", "Join launch support communities",
     "Indie Hackers, Startup School, Launch Chat Slack, GrowthHacker Talk, relevant Discord servers"),
    ("PH: 2. Community", "Build Launch Squad (50-100 people)",
     "Recruit supporters: beta users, friends, community members who will engage on launch day"),
    ("PH: 2. Community", "Collect beta user testimonials",
     'Video preferred, tweets acceptable — assemble a "Wall of Love" for gallery images'),
    ("PH: 2. Community", "Research and secure a PH Hunter",
     "Find established hunter with relevant audience overlap — reach out 2-3 weeks early with product demo"),
    ("PH: 2. Community", "Create email list of warm supporters",
     "Everyone who should know about launch: investors, advisors, beta users, community contacts"),
    ("PH: 2. Community", "Activate Reddit warm-up accounts",
     "If Reddit is part of GTM — accounts need karma history before posting launch content"),

    # ── Phase 3: Asset Production (2-3 weeks before) ──
    ("PH: 3. Assets", "Write PH tagline (max 60 chars)",
     '"Like Google Docs for video" not "WebGL-accelerated timeline editor" — benefit-led, no jargon'),
    ("PH: 3. Assets", "Write PH description (max 255 chars)",
     "Problem → solution → outcome in plain language"),
    ("PH: 3. Assets", "Design logo/thumbnail (240x240px)",
     "Animated GIF under 3MB preferred — motion triggers attention in the feed"),
    ("PH: 3. Assets", "Create gallery images (635x380px)",
     "4-6 images: hero screenshot, feature highlights, Wall of Love testimonials, use cases"),
    ("PH: 3. Assets", "Produce demo video (45-60 seconds)",
     "Scripted, good audio, hook in first 5s, structure: Hook → Problem → Solution → Demo → CTA"),
    ("PH: 3. Assets", "Create mobile-optimized video (9:16)",
     "Same content reformatted for social sharing — TikTok, Reels, Shorts"),
    ("PH: 3. Assets", "Write Maker's Comment draft",
     "Personal story: why you built this, what problem it solves, what feedback you want — not promotional copy"),
    ("PH: 3. Assets", "Prepare FAQ answers",
     "Pre-write responses to likely questions: pricing, comparison to competitors, roadmap, tech stack"),
    ("PH: 3. Assets", "Design social media launch assets",
     "Twitter/LinkedIn graphics, countdown images, launch-day announcement posts"),
    ("PH: 3. Assets", "Create PH-exclusive offer",
     'Special deal for PH visitors: extended trial, discount code (e.g. "HUNT20"), free tier upgrade'),

    # ── Phase 4: Pre-Launch Setup (1-2 weeks before) ──
    ("PH: 4. Pre-Launch", "Create PH Coming Soon teaser page",
     "Upload banner (1:2 ratio desktop, 1:1 mobile, no text on image), short description, collect followers"),
    ("PH: 4. Pre-Launch", "Schedule PH launch (12:01 AM PST)",
     "Use PH scheduling feature — Tuesday-Thursday are best days; avoid Monday/Friday/weekends"),
    ("PH: 4. Pre-Launch", "Send pre-launch email to supporters",
     "Explain importance of launch, ask them to create PH accounts NOW (new accounts' votes count less)"),
    ("PH: 4. Pre-Launch", "Brief Launch Squad with instructions",
     "Share: launch time, link to PH page (not direct product link), ask for comments not upvotes"),
    ("PH: 4. Pre-Launch", "Prepare staggered outreach schedule",
     "Plan 4-5 waves throughout launch day: midnight squad, morning EU, US morning, US afternoon, evening push"),
    ("PH: 4. Pre-Launch", "Set up post-launch email nurture sequence",
     "Automated emails for new signups from PH: welcome → onboarding → value demo → conversion"),
    ("PH: 4. Pre-Launch", "Prepare comment response templates",
     "Pre-draft thoughtful responses for common themes: feature requests, pricing questions, comparison questions"),
    ("PH: 4. Pre-Launch", "Test product onboarding for PH visitors",
     "Ensure value delivery within minutes — PH visitors are curious but impatient, zero friction required"),
    ("PH: 4. Pre-Launch", "Remove or defer any paywall/credit-card gates",
     "PH visitors bounce immediately at credit card entry — offer free tier or trial without payment"),

    # ── Phase 5: Launch Day Operations (Day 0) ──
    ("PH: 5. Launch Day", "Verify launch went live at 12:01 AM PST",
     "Check PH homepage, confirm all assets display correctly, test all links"),
    ("PH: 5. Launch Day", "Post Maker's Comment immediately",
     "Within 5 minutes of going live — this sets the tone for all engagement"),
    ("PH: 5. Launch Day", "Send Wave 1: Launch Squad notification",
     "Midnight crew: DM your 50-100 supporters, ask them to visit PH and leave genuine comments"),
    ("PH: 5. Launch Day", "Send Wave 2: Email list announcement",
     'Stagger through morning — ask people to "check out and share feedback" (never "upvote")'),
    ("PH: 5. Launch Day", "Send Wave 3: Social media posts",
     "LinkedIn, Twitter/X, Facebook — share personal story of the launch, link to PH homepage (not direct link)"),
    ("PH: 5. Launch Day", "Reply to every PH comment within 15 minutes",
     "Assign team members to shifts — 24 hour coverage; algorithm counts engagement depth"),
    ("PH: 5. Launch Day", "Monitor and share live on social media",
     "Post real-time updates: ranking position, comments received, milestones — creates FOMO and urgency"),
    ("PH: 5. Launch Day", "Send Wave 4: Afternoon push to communities",
     "Share in Slack groups, Discord servers, Indie Hackers — personal message not spam blast"),
    ("PH: 5. Launch Day", "Send Wave 5: Evening international push",
     "Reach time zones that missed the morning waves — EU evening, APAC morning"),
    ("PH: 5. Launch Day", "Track metrics throughout the day",
     "Upvotes, comments, website traffic, signups, conversion rate — adjust outreach if velocity drops"),

    # ── Phase 6: Post-Launch (Days 1-7) ──
    ("PH: 6. Post-Launch", "Post thank-you update on PH",
     "Share results, thank community, announce any improvements made from feedback"),
    ("PH: 6. Post-Launch", "Share ranking screenshot on all socials",
     '"We launched on Product Hunt and ranked #X!" — social proof content for LinkedIn, Twitter, Instagram'),
    ("PH: 6. Post-Launch", "Write launch case study / retrospective",
     "Share conversion rates, traffic numbers, what worked, what didn't — other founders will link to this"),
    ("PH: 6. Post-Launch", "Follow up with engaged commenters",
     "Personal DMs to people who left thoughtful comments — potential power users, advocates, or partners"),
    ("PH: 6. Post-Launch", "Fix top issues surfaced in comments",
     "Ship small batch of improvements within 48 hours — shows responsiveness"),
    ("PH: 6. Post-Launch", "Send post-launch email to new signups",
     '"Thanks for finding us on PH" — nurture sequence kicks in with onboarding content'),
    ("PH: 6. Post-Launch", "Submit to PH newsletters/collections",
     "Apply for Product Hunt newsletters and themed collections for extended visibility"),

    # ── Phase 7: Leverage & Amplify (Weeks 2-4) ──
    ("PH: 7. Leverage", "Pitch PR using PH ranking as proof",
     "Include PH ranking in outreach subject lines to blogs, podcasts, tech press — credible social proof"),
    ("PH: 7. Leverage", "Create backlink outreach campaign",
     "PH gives DR91 backlink; use case study to earn links from marketing blogs and founder communities"),
    ("PH: 7. Leverage", "Repurpose PH assets across channels",
     "Demo video → YouTube, gallery images → blog posts, maker's comment → LinkedIn article"),
    ("PH: 7. Leverage", "Interview a power user for content",
     "Spotlight a PH-discovered user — they share with their audience, earning organic backlinks"),
    ("PH: 7. Leverage", "Submit to product listing directories",
     "Use PH badge/ranking when applying to: G2, Capterra, AlternativeTo, SaaSHub, and similar directories"),
    ("PH: 7. Leverage", "Plan re-launch for major update",
     "PH allows re-launches for significant new versions — start planning the next cycle"),
]
# fmt: on


async def seed_checklist_template(session) -> None:  # noqa: ANN001
    """Seed 56 checklist template items (idempotent)."""
    existing = await session.execute(
        select(MarketingChecklistTemplate).where(
            MarketingChecklistTemplate.source_type == SOURCE_TYPE
        )
    )
    if list(existing.scalars().all()):
        print("Checklist template already seeded — skipping.")
        return

    for idx, (category, title, description) in enumerate(TEMPLATE_ITEMS):
        session.add(
            MarketingChecklistTemplate(
                title=title,
                category=category,
                description=description,
                source_type=SOURCE_TYPE,
                order_index=idx,
                is_active=True,
            )
        )
    await session.flush()
    print(f"Seeded {len(TEMPLATE_ITEMS)} checklist template items.")


async def seed_knowledge_entries(session, *, force: bool = False) -> None:  # noqa: ANN001
    """Seed 10 GTM playbook knowledge entries (idempotent unless --force)."""
    existing = await session.execute(
        select(KnowledgeEntry).where(KnowledgeEntry.category == KNOWLEDGE_CATEGORY)
    )
    existing_entries = list(existing.scalars().all())

    if existing_entries and not force:
        print("Knowledge entries already seeded — skipping. Use --force to replace.")
        return

    if existing_entries and force:
        await session.execute(
            delete(KnowledgeEntry).where(KnowledgeEntry.category == KNOWLEDGE_CATEGORY)
        )
        await session.flush()
        print(f"Deleted {len(existing_entries)} existing GTM knowledge entries.")

    # Look up admin profile for created_by
    result = await session.execute(
        select(Profile).where(Profile.email == ADMIN_EMAIL)
    )
    admin = result.scalar_one_or_none()
    if not admin:
        print(f"Admin user ({ADMIN_EMAIL}) not found. Run `make db-seed` first.")
        return

    for title, content in PH_KNOWLEDGE_ENTRIES:
        session.add(
            KnowledgeEntry(
                title=title,
                content=content,
                category=KNOWLEDGE_CATEGORY,
                entry_type="text",
                created_by=admin.id,
                product_id=None,
            )
        )
    await session.flush()
    print(f"Seeded {len(PH_KNOWLEDGE_ENTRIES)} GTM knowledge entries.")


async def main(force: bool = False) -> None:
    async with async_session_factory() as session:
        await seed_checklist_template(session)
        await seed_knowledge_entries(session, force=force)
        await session.commit()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed PH checklist and knowledge entries")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Delete and re-seed GTM knowledge entries (replaces plain text with markdown)",
    )
    args = parser.parse_args()
    asyncio.run(main(force=args.force))
