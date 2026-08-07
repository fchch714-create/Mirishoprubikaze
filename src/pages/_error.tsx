export function getServerSideProps({ res, err }: any) {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { props: { statusCode } };
}

export default function ErrorPage({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>{statusCode ? `${statusCode} - Xəta Baş Verdi` : 'Xəta Baş Verdi'}</h1>
      <p><a href="/az">Ana səhifəyə qayıt</a></p>
    </div>
  );
}
