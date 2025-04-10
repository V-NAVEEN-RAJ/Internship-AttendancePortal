const SectionHeader = ({ title }) => {
  return (
    <div className="text-center mb-4">
      <h2 className="section-title">{title}</h2>
      <hr className="section-divider mx-auto" style={{ width: '200px' }} />
    </div>
  );
};

export default SectionHeader;
