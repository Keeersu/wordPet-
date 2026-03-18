# Product Context: WordPet（猫猫冒险游记）

## Product Overview

**WordPet** — A mobile-first gamified English vocabulary learning app where users explore themed adventure "rooms" with a cat companion, turning repetitive word memorization into an engaging journey. Slogan: *Learn, play, purr.*

## Target Users

- **English Learners (Chinese-speaking)**: Casual learners who prefer gamified, bite-sized learning sessions over textbook-style study
  - Context: Daily commute, short breaks, or before-bed sessions on mobile devices; motivated by visual progress and pet companionship

## Core Problems

1. **Vocabulary learning is tedious**: Traditional flashcard apps lack engagement, leading to high dropout rates
2. **Lack of motivation to return**: Without gamification hooks (progress, unlocking, companionship), learners lose consistency

## Product Scope

**Core Features** (directly deliver value):

- [ ] Room Adventures (章节学习): Themed adventure rooms with word sets — users progress through rooms to learn vocabulary in contextual, story-driven chapters
- [ ] Word Collection (图鉴): A dictionary/gallery of all learned words, organized by room/theme
- [ ] Practice (练习): Vocabulary exercises and quizzes to reinforce learned words

**Supporting Features** (enable or enhance core):

- [ ] Profile (我的): User profile, learning stats, and preferences
- [ ] Settings (设置): App configuration (notifications, language preferences)

## Out of Scope

- Desktop-optimized layouts (mobile H5 only, 375pt baseline)
- Social features (sharing, leaderboards, friend system)
- Payment / in-app purchases
- User-generated content

## Design Specifications

- **Device**: Mobile H5, baseline width 375pt
- **iOS Safe Area**: Top 52px, Bottom 42px
- **Visual Style**: ChunkyToybox — white strokes, solid shadows (no blur), rounded shapes, candy color palette
- **Color Palette**: Primary #FFB840 (warm yellow), Secondary #4ECDC4 (teal), Background #FFF8E7 (cream white), Text #5D4037 (dark brown), Success #66BB6A, Error #EF5350
- **Typography**: English — Nunito, Chinese — PingFang SC
- **Border Radius**: small 8px, medium 12px, large 20px
- **Card Shadow**: Solid 0 4px 0 0 #C07800
