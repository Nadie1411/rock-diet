import HomeDashboard from '../components/HomeDashboard';

/**
 * The same home page whether or not you are signed in.
 *
 * There used to be two: a marketing page for visitors — hero, category grid,
 * dish gallery, offers carousel, a map of the kitchen — and the app's own
 * dashboard for customers. Signing in replaced the site with a different one,
 * and signing out replaced it back.
 *
 * There is only the app now. A visitor sees what a customer sees; the parts
 * that need an account have nothing in them yet and say so — no plan, no
 * upcoming meals — with the package card standing where a plan would be.
 * Nothing asks who they are until they do something that cannot be done
 * anonymously, and then it asks in place.
 */
export default function Home() {
  return (
    <div className="bg-bg text-text">
      <HomeDashboard />
    </div>
  );
}
