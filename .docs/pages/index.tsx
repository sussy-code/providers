import {
  Button,
  Card,
  CardGrid,
  GuiderLayout,
  Hero,
} from '@neato/guider/client';

export default function LandingPage() {
  return (
    <GuiderLayout meta={{ layout: 'page' }}>
      <Hero>
        <Hero.Badge title="V2.3.0" to="/get-started/changelog">
          See changelog for more
        </Hero.Badge>
        <Hero.Title>@movie-web/providers</Hero.Title>
        <Hero.Subtitle>
          Easily scrape all sorts of media sites for content.
        </Hero.Subtitle>
        <Hero.Actions>
          <Button to="/get-started/introduction">Get Started</Button>
          <Button to="https://github.com/movie-web/providers" type="secondary">
            Open on GitHub →
          </Button>
        </Hero.Actions>
      </Hero>
      <CardGrid>
        <Card icon="mdi:code-json" title="Scrape popular streaming websites.">
          Don&apos;t settle for just one media site for you content, use
          everything that&apos;s available.
        </Card>
        <Card icon="mdi:git" title="Multi-platform.">
          Scrape from browser or server, whichever you prefer.
        </Card>
        <Card icon="mdi:language-typescript" title="Easy to use.">
          Get started with scraping your favourite media sites with just 5 lines
          of code. Fully typed of course.
        </Card>
      </CardGrid>
    </GuiderLayout>
  );
}
